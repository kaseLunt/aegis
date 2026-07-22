#!/usr/bin/env python3
"""Scope gate v3 -- staged files judged against the committing lane's claim (W0E).

Modes (all state read from the STAGED INDEX, all failure paths CLOSED):
- AEGIS_AGENT=<agent>: the lane's claim resolves scope. The integrator lane (claim.task ==
  STATUS.active_task) additionally holds control-plane authority (roadmap/**). Every other
  lane gets ONLY its charter/claim paths plus narrow capture (ideas/insights/risks) and may
  renew its own claim lease -- it may NOT edit charters, other claims, STATUS, ROADMAP, or
  another lane's outputs, and may not alter its claim's task/allowed_paths.
- No AEGIS_AGENT: allowed only while at most one active claim exists in the index (solo
  mode); resolves through STATUS.active_task with control-plane authority. With multiple
  active lanes, identity is mandatory.
- STATUS.active_task=none with any active claim staged: blocked.

Protected files (VISION/SYSTEM/RULES) require the owner override in every mode. A HUMAN may
override one commit with AEGIS_SCOPE_OVERRIDE=1; agents halt and report instead. Residual
(documented): AEGIS_AGENT is a cooperative, unauthenticated identity; integrator/solo mode
can edit charters the gate then trusts -- CI's base-to-head scope diff makes that loud.

Usage: python roadmap/tools/scope_gate.py [files...]   (no args: uses staged files)
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
CAPTURE_ALLOWED = ['roadmap/ideas/**', 'roadmap/insights/**', 'roadmap/risks/**']
PROTECTED = ['roadmap/VISION.md', 'roadmap/SYSTEM.md', 'roadmap/RULES.md']
OVERRIDE = os.environ.get('AEGIS_SCOPE_OVERRIDE') == '1'


def git(*args):
    return subprocess.run(['git', *args], cwd=REPO, capture_output=True, text=True)


def staged_content(path):
    r = git('show', ':' + path)
    return r.stdout if r.returncode == 0 else None


def head_content(path):
    r = git('show', 'HEAD:' + path)
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


def staged_index_files(prefix):
    out = git('ls-files', '--cached', '--', prefix).stdout
    return [f for f in out.replace('\\', '/').split('\n') if f.endswith('.md')]


def staged_work_item(task_id):
    for wf in staged_index_files('roadmap/work'):
        fm = parse_fm(staged_content(wf))
        if fm and fm.get('id') == task_id:
            return (wf, fm)
    return None


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
        return blocked("protected control-plane files staged (owner-only surfaces)", prot)

    active_claims = {}
    for cf in staged_index_files('roadmap/claims'):
        cfm = parse_fm(staged_content(cf))
        if cfm and cfm.get('status') == 'active' and cfm.get('agent'):
            active_claims[cfm['agent']] = (cf, cfm)

    status = parse_fm(staged_content('roadmap/STATUS.md'))
    if status is None:
        return blocked("staged roadmap/STATUS.md is missing or has no frontmatter (fail-closed)")
    active_task = status.get('active_task')
    agent = os.environ.get('AEGIS_AGENT')

    if not agent:
        if len(active_claims) > 1:
            return blocked(f"{len(active_claims)} active lanes exist -- identity is mandatory",
                           extra=["Set AEGIS_AGENT=<agent> so this commit is judged against ONE claim."])
        if not active_task or active_task == 'none':
            if active_claims:
                return blocked("STATUS active_task is 'none' while active claims exist",
                               extra=["Set AEGIS_AGENT=<agent> or point STATUS.active_task at the integration task."])
            return 0
        item = staged_work_item(active_task)
        if item is None:
            return blocked(f"active_task '{active_task}' has no work file in the staged index")
        declared = item[1].get('allowed_paths') or []
        if not declared:
            return blocked(f"active work item '{active_task}' declares no allowed_paths")
        allowed = list(dict.fromkeys(declared + ['roadmap/**']))
        lane_guard = None
    else:
        if agent not in active_claims:
            return blocked(f"AEGIS_AGENT='{agent}' has no active claim in the staged index",
                           extra=["Fail-closed: open and stage the claim first (claim.py open ...)."])
        cpath, cfm = active_claims[agent]
        task = cfm.get('task')
        item = staged_work_item(task)
        if item is None:
            return blocked(f"claim task '{task}' has no work file in the staged index")
        declared = cfm.get('allowed_paths') or item[1].get('allowed_paths') or []
        if not declared:
            return blocked(f"neither claim '{agent}' nor task '{task}' declares allowed_paths")
        if task == active_task:
            allowed = list(dict.fromkeys(declared + ['roadmap/**']))
            lane_guard = None
        else:
            allowed = list(dict.fromkeys(declared + CAPTURE_ALLOWED + [cpath]))
            lane_guard = (cpath, cfm)

    if lane_guard:
        cpath, cfm = lane_guard
        if cpath in staged:
            hfm = parse_fm(head_content(cpath))
            if hfm is None:
                return blocked(f"lane '{agent}' staged a NEW claim file -- claims are opened by the integrator")
            for field in ('task', 'allowed_paths', 'agent'):
                if (hfm.get(field) or None) != (cfm.get(field) or None):
                    return blocked(f"lane '{agent}' changed claim field '{field}' -- lanes may only renew/release",
                                   [cpath])

    violations = [f for f in staged if not any(fnmatchcase(f, p) for p in allowed)]
    if not violations:
        return 0
    if OVERRIDE:
        print(f"scope-gate: OVERRIDDEN by AEGIS_SCOPE_OVERRIDE=1 -- {len(violations)} out-of-scope file(s) allowed this once.")
        return 0
    return blocked("staged files outside this lane's scope", violations,
                   [f"lane: {agent or 'solo/' + str(active_task)}", "allowed:"] + [f"  - {p}" for p in allowed] + [
                       "Resolve the root cause -- do NOT bypass:",
                       "  * belongs to this lane -> integrator amends the charter/claim (owner approval) and restages",
                       "  * capture -> use roadmap/ideas|insights|risks (always in lane scope)",
                       "  * other lane's work -> commit it under THAT lane's AEGIS_AGENT"])


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
