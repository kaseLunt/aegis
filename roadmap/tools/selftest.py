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

    def fab_claim(rm, name, body):
        os.makedirs(os.path.join(rm, 'claims'), exist_ok=True)
        open(os.path.join(rm, 'claims', f'CLAIM-{name}.md'), 'w', encoding='utf-8', newline='\n').write(body)

    def fab_unclaimed_active(rm):
        fab_active_unachieved_dep(rm)  # active WTEST2 with no claim
    mutate('active-item-requires-claim', 'active claims (need exactly 1', fab_unclaimed_active)

    def fab_expired_lease(rm):
        fab_claim(rm, 'agentx', '---\nagent: agentx\ntask: W1\nstatus: active\n'
                  'lease_expires: 2020-01-01T00:00:00Z\nupdated: 2020-01-01T00:00:00Z\n---\n')
    mutate('expired-lease-flagged', 'lease expired', fab_expired_lease)

    def fab_double_claim(rm):
        fab_claim(rm, 'agenty', '---\nagent: agentz\ntask: W1\nstatus: active\n'
                  'lease_expires: 2099-01-01T00:00:00Z\n---\n')
        fab_claim(rm, 'agentz', '---\nagent: agentz\ntask: W1\nstatus: active\n'
                  'lease_expires: 2099-01-01T00:00:00Z\n---\n')
    mutate('one-claim-per-agent', 'more than one active claim', fab_double_claim)

    mutate('none-with-active-work', "while active work exists",
           lambda rm: edit(os.path.join(rm, 'STATUS.md'),
                           lambda s: re.sub(r'^active_task: .*$', 'active_task: none', s, count=1, flags=re.M)))

    def fab_bad_lease(rm):
        fab_claim(rm, 'agentl', '---\nagent: agentl\ntask: W1\nstatus: active\nlease_expires: forever\n---\n')
    mutate('lease-must-be-strict-utc', 'not strict UTC', fab_bad_lease)

    def fab_name_mismatch(rm):
        fab_claim(rm, 'agentm', '---\nagent: other\ntask: W1\nstatus: active\n'
                  'lease_expires: 2099-01-01T00:00:00Z\n---\n')
    mutate('claim-agent-matches-filename', 'does not match claim filename', fab_name_mismatch)

    def fab_missing_deliverable(rm):
        fab_claim(rm, 'agentd', '')  # ensure claims dir exists
        os.remove(os.path.join(rm, 'claims', 'CLAIM-agentd.md'))
        open(os.path.join(rm, 'work', 'WTEST3-fab.md'), 'w', encoding='utf-8', newline='\n').write(
            '---\nid: WTEST3\ntype: work\ntitle: fab\nphase: P0\nstatus: achieved\n'
            'evidence_target: "Correct"\ndepends_on: []\nblocked_by: []\n'
            'deliverables:\n  - roadmap/research/NOPE/missing.md\n---\n\n# t\n')
    mutate('achieved-requires-deliverables', 'deliverable missing', fab_missing_deliverable)


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
        run(['git', 'checkout', '--', 'roadmap/VISION.md'], cwd=repo)

        # --- Lane-mode tests (W0D claims + W0E hardening) ---
        w = lambda rel, s: open(os.path.join(repo, rel), 'w', encoding='utf-8', newline='\n').write(s)
        os.makedirs(os.path.join(repo, 'roadmap', 'claims'), exist_ok=True)
        w(os.path.join('roadmap', 'claims', 'CLAIM-int.md'),
          '---\nagent: int\ntask: WT\nstatus: active\nlease_expires: 2099-01-01T00:00:00Z\n---\n')
        run(['git', 'add', 'roadmap/claims'], cwd=repo)

        # active_task none while claims exist: blocked (was the reviewer's bypass).
        w(os.path.join('roadmap', 'STATUS.md'), STATUS_NONE)
        run(['git', 'add', 'roadmap/STATUS.md'], cwd=repo)
        r = gate(repo)
        check('B:none-with-claims-blocked', r.returncode == 1, r.stdout[-300:])
        w(os.path.join('roadmap', 'STATUS.md'), STATUS_ACTIVE)
        run(['git', 'add', 'roadmap/STATUS.md'], cwd=repo)

        # Second lane: identity becomes mandatory without AEGIS_AGENT.
        w(os.path.join('roadmap', 'work', 'WT2.md'), WORK_WT.replace('id: WT', 'id: WT2'))
        w(os.path.join('roadmap', 'claims', 'CLAIM-lane1.md'),
          '---\nagent: lane1\ntask: WT2\nstatus: active\nallowed_paths:\n  - src/ok.txt\n'
          'lease_expires: 2099-01-01T00:00:00Z\n---\n')
        run(['git', 'add', 'roadmap', 'src'], cwd=repo)
        # The integrator commits claim/charter setup before lanes commit (real flow).
        run(['git', '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'claims', '--no-verify'], cwd=repo)
        open(os.path.join(repo, 'src', 'ok.txt'), 'a', encoding='utf-8').write('more\n')
        run(['git', 'add', 'src/ok.txt'], cwd=repo)
        r = gate(repo)
        check('B:multi-claim-requires-identity', r.returncode == 1 and 'identity is mandatory' in r.stdout, r.stdout[-300:])
        check('B:integrator-identity-passes', gate(repo, env={'AEGIS_AGENT': 'int'}).returncode == 0)

        # Lane confinement: claim-narrowed paths, no cross-lane roadmap access, capture stays open.
        os.makedirs(os.path.join(repo, 'src2'), exist_ok=True)
        w(os.path.join('src2', 'other.txt'), 'x\n')
        run(['git', 'add', 'src2'], cwd=repo)
        r = gate(repo, env={'AEGIS_AGENT': 'lane1'})
        check('B:agent-claim-scope-blocks', r.returncode == 1 and 'src2/other.txt' in r.stdout, r.stdout[-300:])
        run(['git', 'reset', '-q', '--', 'src2'], cwd=repo)
        os.makedirs(os.path.join(repo, 'roadmap', 'research', 'OTHER'), exist_ok=True)
        w(os.path.join('roadmap', 'research', 'OTHER', 'x.md'), 'x\n')
        run(['git', 'add', 'roadmap/research'], cwd=repo)
        r = gate(repo, env={'AEGIS_AGENT': 'lane1'})
        check('B:lane-cannot-touch-roadmap', r.returncode == 1 and 'OTHER/x.md' in r.stdout, r.stdout[-300:])
        run(['git', 'rm', '-rq', '--cached', 'roadmap/research'], cwd=repo)
        os.makedirs(os.path.join(repo, 'roadmap', 'ideas'), exist_ok=True)
        w(os.path.join('roadmap', 'ideas', 'IDEA-t.md'), 'x\n')
        run(['git', 'add', 'roadmap/ideas'], cwd=repo)
        check('B:lane-capture-allowed', gate(repo, env={'AEGIS_AGENT': 'lane1'}).returncode == 0)
        run(['git', 'rm', '-rq', '--cached', 'roadmap/ideas'], cwd=repo)
        open(os.path.join(repo, 'roadmap', 'work', 'WT2.md'), 'a', encoding='utf-8').write('edit\n')
        run(['git', 'add', 'roadmap/work/WT2.md'], cwd=repo)
        r = gate(repo, env={'AEGIS_AGENT': 'lane1'})
        check('B:lane-charter-edit-blocked', r.returncode == 1 and 'WT2.md' in r.stdout, r.stdout[-300:])
        r = gate(repo, env={'AEGIS_AGENT': 'ghost'})
        check('B:unknown-agent-fails-closed', r.returncode == 1, r.stdout[-300:])

        # Cleanup lane state before the fingerprint section.
        run(['git', 'rm', '-rq', '--cached', 'roadmap/claims', 'roadmap/work/WT2.md'], cwd=repo)
        for junk in ('roadmap/claims/CLAIM-int.md', 'roadmap/claims/CLAIM-lane1.md',
                     'roadmap/work/WT2.md', 'roadmap/ideas/IDEA-t.md', 'roadmap/research/OTHER/x.md'):
            os.remove(os.path.join(repo, junk))

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
