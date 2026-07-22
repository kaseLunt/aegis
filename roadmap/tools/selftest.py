#!/usr/bin/env python3
"""Control-plane selftest -- mutation tests for the gates themselves (D-004 rule 15).

The validator is code with its own tests (SYSTEM.md). Two parts:
  A. doctor mutations: copy roadmap/ to a temp tree, apply one corruption, assert the
     targeted error appears (baseline-diff so environment noise can't mask results).
  B. gate integration: build a scratch git repo and prove scope_gate judges the STAGED
     INDEX (bypass closed), fails closed on missing scope state, blocks protected files,
     and that evidence fingerprints invalidate when staged inputs change.

Usage: python roadmap/tools/selftest.py   (exit 1 on any failure)
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROADMAP = os.path.dirname(TOOLS)
REPO = os.path.dirname(ROADMAP)
PY = sys.executable
failures = []


def check(name, ok, detail=''):
    print(f"  {'ok  ' if ok else 'FAIL'} {name}" + (f" -- {detail}" if detail and not ok else ''))
    if not ok:
        failures.append(name)


def run(args, cwd, env=None):
    e = dict(os.environ)
    e.pop('AEGIS_SCOPE_OVERRIDE', None)
    if env:
        e.update(env)
    return subprocess.run(args, cwd=cwd, capture_output=True, text=True, encoding='utf-8', env=e)


def doctor_errors(repo_dir):
    r = run([PY, os.path.join(repo_dir, 'roadmap', 'tools', 'doctor.py')], cwd=repo_dir)
    return r.returncode, {l.strip() for l in r.stdout.splitlines() if 'ERROR' in l}


# ---------- Part A: doctor mutations against a copy of the real roadmap ----------

def fresh_copy(tmp):
    dst = os.path.join(tmp, 'proj')
    if os.path.exists(dst):
        shutil.rmtree(dst)
    os.makedirs(dst)
    shutil.copytree(ROADMAP, os.path.join(dst, 'roadmap'))
    return dst


def mutate(name, expect, transform):
    with tempfile.TemporaryDirectory() as tmp:
        proj = fresh_copy(tmp)
        _, baseline = doctor_errors(proj)
        transform(os.path.join(proj, 'roadmap'))
        rc, after = doctor_errors(proj)
        new = {e for e in after if e not in baseline}
        hit = any(expect in e for e in new)
        check(f"A:{name}", rc == 1 and hit, f"expected new error containing '{expect}', got {sorted(new) or 'none'}")


def edit(path, fn):
    s = open(path, encoding='utf-8').read()
    open(path, 'w', encoding='utf-8', newline='\n').write(fn(s))


def part_a():
    print("Part A: doctor mutation tests")
    mutate('ladder-status-drift', 'copy drifted',
           lambda rm: edit(os.path.join(rm, 'ROADMAP.md'), lambda s: s.replace('| achieved |', '| wrong |', 1)))
    mutate('status-file-required', 'missing or has no frontmatter',
           lambda rm: os.remove(os.path.join(rm, 'STATUS.md')))
    mutate('single-in-progress-phase', "exactly one phase must be 'In progress'",
           lambda rm: edit(os.path.join(rm, 'ROADMAP.md'), lambda s: s.replace('| Planned |', '| In progress |', 1)))
    def fab_unapproved_decision(rm):
        open(os.path.join(rm, 'decisions', 'DTEST-fab.md'), 'w', encoding='utf-8', newline='\n').write(
            '---\nid: DTEST\ntype: decision\ntitle: fab\nstatus: accepted\ndate: 2026-01-01\nsupersedes: []\n---\n\n# t\n')
    mutate('accepted-decision-needs-approval', "without approved_by", fab_unapproved_decision)

    def fab_active_no_handoff(rm):
        open(os.path.join(rm, 'work', 'WTEST-fab.md'), 'w', encoding='utf-8', newline='\n').write(
            '---\nid: WTEST\ntype: work\ntitle: fab\nphase: P0\nstatus: active\n'
            'evidence_target: "Correct"\ndepends_on: []\nblocked_by: []\nallowed_paths:\n  - src/**\n---\n\n# WTEST\n')
    mutate('active-requires-handoff', "missing '## Handoff'", fab_active_no_handoff)

    def fab_active_unachieved_dep(rm):
        open(os.path.join(rm, 'work', 'WTEST2-fab.md'), 'w', encoding='utf-8', newline='\n').write(
            '---\nid: WTEST2\ntype: work\ntitle: fab\nphase: P0\nstatus: active\n'
            'evidence_target: "Correct"\ndepends_on: [W1]\nblocked_by: []\nallowed_paths:\n  - src/**\n---\n\n# t\n\n'
            '## Handoff\n- next: placeholder next steps long enough to satisfy the resumability check for tests.\n'
            '- read_first: none\n- hazards: none\n')
    mutate('active-requires-achieved-deps', 'not achieved', fab_active_unachieved_dep)


# ---------- Part B: staged-index gate integration in a scratch git repo ----------

STATUS_ACTIVE = ('---\nactive_phase: P0\nactive_task: WT\nupdated: 2026-01-01\n---\n# S\n')
STATUS_NONE = STATUS_ACTIVE.replace('active_task: WT', 'active_task: none')
WORK_WT = ('---\nid: WT\ntype: work\ntitle: t\nphase: P0\nstatus: active\nevidence_target: "Correct"\n'
           'depends_on: []\nblocked_by: []\nallowed_paths:\n  - src/**\n'
           'invalidated_by:\n  - src/**\n---\n\n# WT\n\n'
           '## Handoff\n- next: placeholder next steps long enough to satisfy the resumability check for tests.\n'
           '- read_first: none\n- hazards: none\n')
ROADMAP_MIN = '# R\n\n## Phases\n| ID | Phase | Goal | State |\n|---|---|---|---|\n| P0 | t | t | **In progress** |\n'


def build_fixture(tmp):
    repo = os.path.join(tmp, 'fix')
    os.makedirs(os.path.join(repo, 'roadmap', 'work'))
    os.makedirs(os.path.join(repo, 'roadmap', 'tools'))
    os.makedirs(os.path.join(repo, 'src'))
    for tool in ('doctor.py', 'scope_gate.py'):
        shutil.copy(os.path.join(TOOLS, tool), os.path.join(repo, 'roadmap', 'tools', tool))
    w = lambda rel, s: open(os.path.join(repo, rel), 'w', encoding='utf-8', newline='\n').write(s)
    w(os.path.join('roadmap', 'STATUS.md'), STATUS_ACTIVE)
    w(os.path.join('roadmap', 'ROADMAP.md'), ROADMAP_MIN)
    w(os.path.join('roadmap', 'work', 'WT.md'), WORK_WT)
    w(os.path.join('roadmap', 'VISION.md'), '# V\n')
    w(os.path.join('src', 'ok.txt'), 'a\n')
    w('evil.txt', 'b\n')
    run(['git', 'init', '-q'], cwd=repo)
    run(['git', 'add', 'roadmap', 'src'], cwd=repo)
    run(['git', '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'init', '--no-verify'], cwd=repo)
    return repo


def gate(repo, env=None):
    return run([PY, os.path.join(repo, 'roadmap', 'tools', 'scope_gate.py')], cwd=repo, env=env)


def part_b():
    print("Part B: staged-index gate integration")
    with tempfile.TemporaryDirectory() as tmp:
        repo = build_fixture(tmp)
        open(os.path.join(repo, 'src', 'ok.txt'), 'w', encoding='utf-8', newline='\n').write('edit\n')
        run(['git', 'add', 'src/ok.txt'], cwd=repo)
        check('B:in-scope-passes', gate(repo).returncode == 0)

        run(['git', 'add', 'evil.txt'], cwd=repo)
        r = gate(repo)
        check('B:out-of-scope-blocks', r.returncode == 1 and 'evil.txt' in r.stdout, r.stdout[-300:])

        # Bypass closure: worktree STATUS says 'none' but the STAGED STATUS still says WT.
        open(os.path.join(repo, 'roadmap', 'STATUS.md'), 'w', encoding='utf-8', newline='\n').write(STATUS_NONE)
        r = gate(repo)
        check('B:worktree-vs-index-bypass-closed', r.returncode == 1, r.stdout[-300:])
        run(['git', 'checkout', '--', 'roadmap/STATUS.md'], cwd=repo)

        check('B:owner-override-works', gate(repo, env={'AEGIS_SCOPE_OVERRIDE': '1'}).returncode == 0)
        run(['git', 'reset', '-q', '--', 'evil.txt'], cwd=repo)

        # Fail closed: active task whose work file is absent from the index.
        open(os.path.join(repo, 'roadmap', 'STATUS.md'), 'w', encoding='utf-8', newline='\n').write(
            STATUS_ACTIVE.replace('WT', 'WMISSING'))
        run(['git', 'add', 'roadmap/STATUS.md'], cwd=repo)
        r = gate(repo)
        check('B:missing-work-file-fails-closed', r.returncode == 1 and 'WMISSING' in r.stdout, r.stdout[-300:])
        open(os.path.join(repo, 'roadmap', 'STATUS.md'), 'w', encoding='utf-8', newline='\n').write(STATUS_ACTIVE)
        run(['git', 'add', 'roadmap/STATUS.md'], cwd=repo)

        # Protected constitution files block even in-scope commits.
        open(os.path.join(repo, 'roadmap', 'VISION.md'), 'a', encoding='utf-8').write('edit\n')
        run(['git', 'add', 'roadmap/VISION.md'], cwd=repo)
        r = gate(repo)
        check('B:protected-files-block', r.returncode == 1 and 'VISION' in r.stdout, r.stdout[-300:])
        run(['git', 'reset', '-q', '--', 'roadmap/VISION.md'], cwd=repo)

        # Evidence fingerprint: stamp an achieved item, then change a staged input.
        edit(os.path.join(repo, 'roadmap', 'work', 'WT.md'),
             lambda s: s.replace('status: active', 'status: achieved'))
        open(os.path.join(repo, 'roadmap', 'STATUS.md'), 'w', encoding='utf-8', newline='\n').write(STATUS_NONE)
        run(['git', 'add', 'roadmap'], cwd=repo)
        run([PY, os.path.join(repo, 'roadmap', 'tools', 'doctor.py'), '--stamp', 'WT'], cwd=repo)
        run(['git', 'add', 'roadmap'], cwd=repo)
        rc, errs = doctor_errors(repo)
        check('B:stamped-fingerprint-passes', not any('INVALIDATED' in e or 'without evidence_fingerprint' in e for e in errs),
              str(sorted(errs)))
        open(os.path.join(repo, 'src', 'ok.txt'), 'w', encoding='utf-8', newline='\n').write('changed\n')
        run(['git', 'add', 'src/ok.txt'], cwd=repo)
        rc, errs = doctor_errors(repo)
        check('B:changed-input-invalidates', rc == 1 and any('INVALIDATED' in e for e in errs), str(sorted(errs)))


if __name__ == '__main__':
    part_a()
    part_b()
    print(f"\n{'FAIL' if failures else 'OK'} -- {len(failures)} failing: {failures or ''}")
    sys.exit(1 if failures else 0)
