#!/usr/bin/env python3
"""Scope gate -- staged files must fall within the active work item's allowed_paths.

D-004 rule 8: executor commit authority is scoped to the paths the task owns. Capture is
always in scope (roadmap/**) so filing ideas/insights/decisions mid-task is never blocked.
No active task => nothing to enforce. A HUMAN may override one commit with
AEGIS_SCOPE_OVERRIDE=1; agents must instead halt, report root cause, and either park the
task or get the work item's allowed_paths amended.

Usage: python roadmap/tools/scope_gate.py [files...]   (no args: uses staged files)
Exit 1 on violation.
"""
import glob
import os
import re
import subprocess
import sys
from fnmatch import fnmatchcase

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROADMAP = os.path.dirname(TOOLS)
REPO = os.path.dirname(ROADMAP)
ALWAYS_ALLOWED = ['roadmap/**']


def frontmatter(path):
    try:
        text = open(path, encoding='utf-8').read()
    except OSError:
        return {}
    if not text.startswith('---'):
        return {}
    end = text.find('\n---', 3)
    if end == -1:
        return {}
    d, lines, i = {}, text[3:end].strip('\n').split('\n'), 0
    while i < len(lines):
        ln = lines[i]
        if not ln.strip() or ':' not in ln or ln.strip().startswith('#'):
            i += 1
            continue
        k, _, v = ln.partition(':')
        k, v = k.strip(), re.sub(r'\s+#.*$', '', v).strip()
        if v == '' and i + 1 < len(lines) and lines[i + 1].lstrip().startswith('- '):
            items, j = [], i + 1
            while j < len(lines) and lines[j].lstrip().startswith('- '):
                items.append(re.sub(r'\s+#.*$', '', lines[j].lstrip()[2:]).strip())
                j += 1
            d[k], i = items, j
            continue
        if v.startswith('[') and v.endswith(']'):
            d[k] = [x.strip() for x in v[1:-1].split(',') if x.strip()]
        else:
            d[k] = v
        i += 1
    return d


def main(argv):
    status = frontmatter(os.path.join(ROADMAP, 'STATUS.md'))
    active = status.get('active_task')
    if not active or active == 'none':
        return 0
    item = None
    for wf in glob.glob(os.path.join(ROADMAP, 'work', '*.md')):
        fm = frontmatter(wf)
        if fm.get('id') == active:
            item = (wf, fm)
            break
    if item is None:
        print(f"scope-gate: active_task '{active}' has no work file -- doctor will report this; not enforcing scope.")
        return 0
    allowed = list(item[1].get('allowed_paths') or [])
    if not allowed:
        return 0
    allowed = list(dict.fromkeys(allowed + ALWAYS_ALLOWED))

    if argv:
        staged = argv
    else:
        out = subprocess.run(['git', 'diff', '--cached', '--name-only'],
                             cwd=REPO, capture_output=True, text=True).stdout
        staged = [f for f in out.replace('\\', '/').split('\n') if f]

    violations = [f for f in staged if not any(fnmatchcase(f, p) for p in allowed)]
    if not violations:
        return 0
    if os.environ.get('AEGIS_SCOPE_OVERRIDE') == '1':
        print(f"scope-gate: OVERRIDDEN by AEGIS_SCOPE_OVERRIDE=1 -- {len(violations)} out-of-scope file(s) allowed this once.")
        return 0
    print(f"scope-gate: COMMIT BLOCKED -- staged files outside active work item '{active}' allowed_paths:")
    for f in violations:
        print(f"  - {f}")
    print(f"allowed_paths ({item[0]}):")
    for p in allowed:
        print(f"  - {p}")
    print("Resolve the root cause -- do NOT bypass:")
    print("  * belongs to this task  -> amend allowed_paths in the work item (owner approval) and restage")
    print("  * tangent               -> unstage it; capture intent under roadmap/ideas|insights instead")
    print("  * different task's work -> park the current task in STATUS.md first (WIP=1)")
    print("Human owner only: AEGIS_SCOPE_OVERRIDE=1 git commit ...")
    return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
