#!/usr/bin/env python3
"""Scope gate -- staged files must fall within the active work item's allowed_paths.

D-004 rule 8: executor commit authority is scoped to the paths the task owns. Capture is
always in scope (roadmap/**) so filing ideas/insights/decisions mid-task is never blocked.

All control-plane state (STATUS.md, work items) is read from the STAGED INDEX (`git show
:path`), never the working tree -- the bytes being committed are the bytes that get judged.
Fail-closed: unreadable STATUS, a missing active work file, or an active item without
allowed_paths BLOCKS the commit.

Protected files (VISION/SYSTEM/RULES) require the owner override even with no active task.
A HUMAN may override one commit with AEGIS_SCOPE_OVERRIDE=1; agents must instead halt,
report root cause, and either park the task or get allowed_paths amended.

Usage: python roadmap/tools/scope_gate.py [files...]   (no args: uses staged files)
Exit 1 on violation.
"""
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
REPO = os.path.dirname(os.path.dirname(TOOLS))
ALWAYS_ALLOWED = ['roadmap/**']
# Owner-only surfaces (D-004 HITL): agents may not change the constitution or vision.
PROTECTED = ['roadmap/VISION.md', 'roadmap/SYSTEM.md', 'roadmap/RULES.md']
OVERRIDE = os.environ.get('AEGIS_SCOPE_OVERRIDE') == '1'


def git(*args):
    return subprocess.run(['git', *args], cwd=REPO, capture_output=True, text=True)


def staged_content(path):
    """Content of `path` as it exists in the staged index; None if absent."""
    r = git('show', ':' + path)
    return r.stdout if r.returncode == 0 else None


def parse_fm(text):
    if text is None or not text.startswith('---'):
        return None
    end = text.find('\n---', 3)
    if end == -1:
        return None
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


def blocked(reason, files=(), extra=()):
    print(f"scope-gate: COMMIT BLOCKED -- {reason}")
    for f in files:
        print(f"  - {f}")
    for line in extra:
        print(line)
    print("Agents: halt and report root cause. Human owner only: AEGIS_SCOPE_OVERRIDE=1 git commit ...")
    return 1


def main(argv):
    if argv:
        staged = argv
    else:
        out = git('diff', '--cached', '--name-only').stdout
        staged = [f for f in out.replace('\\', '/').split('\n') if f]
    if not staged:
        return 0

    prot = [f for f in staged if f in PROTECTED]
    if prot and not OVERRIDE:
        return blocked("protected control-plane files staged (owner-only surfaces)", prot,
                       ["These define the constitution/vision; changing them is a human-owner act."])

    status = parse_fm(staged_content('roadmap/STATUS.md'))
    if status is None:
        return blocked("staged roadmap/STATUS.md is missing or has no frontmatter",
                       extra=["The committed state must carry active_phase/active_task (fail-closed)."])
    active = status.get('active_task')
    if not active or active == 'none':
        return 0

    ls = git('ls-files', '--cached', '--', 'roadmap/work')
    item = None
    for wf in [f for f in ls.stdout.replace('\\', '/').split('\n') if f.endswith('.md')]:
        fm = parse_fm(staged_content(wf))
        if fm and fm.get('id') == active:
            item = (wf, fm)
            break
    if item is None:
        return blocked(f"active_task '{active}' has no work file in the staged index",
                       extra=["Fail-closed: stage the work item, or set STATUS active_task correctly."])
    declared = item[1].get('allowed_paths') or []
    if not declared:
        return blocked(f"active work item '{active}' declares no allowed_paths",
                       extra=["Fail-closed: every active item must declare its scope."])
    allowed = list(dict.fromkeys(declared + ALWAYS_ALLOWED))

    violations = [f for f in staged if not any(fnmatchcase(f, p) for p in allowed)]
    if not violations:
        return 0
    if OVERRIDE:
        print(f"scope-gate: OVERRIDDEN by AEGIS_SCOPE_OVERRIDE=1 -- {len(violations)} out-of-scope file(s) allowed this once.")
        return 0
    return blocked(f"staged files outside active work item '{active}' allowed_paths", violations,
                   [f"allowed_paths ({item[0]}):"] + [f"  - {p}" for p in allowed] + [
                       "Resolve the root cause -- do NOT bypass:",
                       "  * belongs to this task  -> amend allowed_paths in the work item (owner approval) and restage",
                       "  * tangent               -> unstage it; capture intent under roadmap/ideas|insights instead",
                       "  * different task's work -> park the current task in STATUS.md first (WIP=1)"])


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
