#!/usr/bin/env python3
"""CI base-to-head scope review (W0E): make scope expansion loud and auditable.

Local gates trust the STAGED charter, so an integrator can expand a work item's
allowed_paths in the same commit that uses the expansion. This check runs in CI over the
actual pushed/PR diff and fails when, between BASE and HEAD:

- a protected file (VISION/SYSTEM/RULES) changed, or
- an EXISTING work item's allowed_paths changed, or
- an EXISTING claim's task/allowed_paths changed, or a claim file was deleted,

UNLESS a commit message in the range carries the marker AEGIS-OWNER-APPROVED. The marker is
cooperative (anyone can type it) -- the point is a permanent, greppable audit trail, with
branch protection as the eventual authority (R-001).

Usage: python roadmap/tools/scope_diff.py <base-sha> <head-sha>
Exit 1 on unapproved scope-affecting changes. Base 0000... (new branch) skips cleanly.
"""
import os
import re
import subprocess
import sys

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

TOOLS = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(TOOLS))
PROTECTED = ['roadmap/VISION.md', 'roadmap/SYSTEM.md', 'roadmap/RULES.md']


def git(*args):
    return subprocess.run(['git', *args], cwd=REPO, capture_output=True, text=True)


def show(ref, path):
    r = git('show', f'{ref}:{path}')
    return r.stdout if r.returncode == 0 else None


def fm_fields(text, fields):
    if text is None or not text.startswith('---'):
        return None
    end = text.find('\n---', 3)
    body = text[3:end] if end != -1 else text
    out = {}
    for f in fields:
        m = re.search(rf'^{f}:\s*(.*)$', body, re.M)
        if m and m.group(1).strip():
            out[f] = m.group(1).strip()
        else:
            lm = re.search(rf'^{f}:\s*\n((?:\s+- .*\n?)+)', body, re.M)
            out[f] = tuple(x.strip('- ').strip() for x in lm.group(1).strip().split('\n')) if lm else None
    return out


def main(argv):
    if len(argv) != 2:
        print(__doc__.strip())
        return 2
    base, head = argv
    if set(base) == {'0'}:
        print("scope-diff: no base (new branch/first push) -- skipping")
        return 0
    if git('cat-file', '-e', f'{base}^{{commit}}').returncode != 0:
        print(f"scope-diff: base {base} not available (shallow clone?) -- skipping with warning")
        return 0

    changed = [f for f in git('diff', '--name-status', f'{base}..{head}').stdout.replace('\\', '/').split('\n') if f]
    findings = []
    for line in changed:
        parts = line.split('\t')
        op, path = parts[0], parts[-1]
        if path in PROTECTED:
            findings.append(f"protected file changed: {path}")
        elif path.startswith('roadmap/claims/') and path.endswith('.md'):
            if op.startswith('D'):
                findings.append(f"claim deleted: {path} (claims are released/archived, not deleted)")
            elif op.startswith('M'):
                b = fm_fields(show(base, path), ['task', 'allowed_paths'])
                h = fm_fields(show(head, path), ['task', 'allowed_paths'])
                if b and h and (b != h):
                    findings.append(f"claim scope/task changed: {path} {b} -> {h}")
        elif path.startswith('roadmap/work/') and path.endswith('.md') and op.startswith('M'):
            b = fm_fields(show(base, path), ['allowed_paths'])
            h = fm_fields(show(head, path), ['allowed_paths'])
            if b and h and b != h:
                findings.append(f"work-item allowed_paths changed: {path} {b.get('allowed_paths')} -> {h.get('allowed_paths')}")

    if not findings:
        print("scope-diff: no scope-affecting changes")
        return 0
    msgs = git('log', '--format=%B', f'{base}..{head}').stdout
    if 'AEGIS-OWNER-APPROVED' in msgs:
        print(f"scope-diff: {len(findings)} scope-affecting change(s), owner-approval marker present:")
        for f in findings:
            print(f"  - {f}")
        return 0
    print("scope-diff: FAIL -- scope-affecting changes without AEGIS-OWNER-APPROVED marker:")
    for f in findings:
        print(f"  - {f}")
    return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
