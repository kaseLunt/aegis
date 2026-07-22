#!/usr/bin/env python3
"""Agent claims -- per-agent task leases for parallel lanes (D-006, IDEA-001 trigger fired).

A claim binds ONE agent to ONE work item with a lease. WIP=1 is per agent; every active
work item must hold exactly one active, unexpired claim (doctor-enforced). The scope gate
resolves commit scope through the claim named by AEGIS_AGENT (falling back to STATUS
active_task).

Usage:
  python roadmap/tools/claim.py open <agent> <task-id> [--hours N] [--worktree W] [--paths a,b]
  python roadmap/tools/claim.py renew <agent> [--hours N]
  python roadmap/tools/claim.py release <agent>
  python roadmap/tools/claim.py list
"""
import datetime
import glob
import os
import subprocess
import sys

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROADMAP = os.path.dirname(TOOLS)
REPO = os.path.dirname(ROADMAP)
CLAIMS = os.path.join(ROADMAP, 'claims')


def now():
    return datetime.datetime.now(datetime.timezone.utc)


def iso(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%SZ')


def claim_path(agent):
    return os.path.join(CLAIMS, f'CLAIM-{agent}.md')


def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def head_commit():
    r = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=REPO, capture_output=True, text=True)
    return r.stdout.strip() or 'unknown'


def main():
    if len(sys.argv) < 2:
        print(__doc__.strip())
        return 2
    cmd = sys.argv[1]
    os.makedirs(CLAIMS, exist_ok=True)

    if cmd == 'list':
        for p in sorted(glob.glob(os.path.join(CLAIMS, 'CLAIM-*.md'))):
            print(open(p, encoding='utf-8').read().split('---')[1].strip().replace('\n', ' | '))
        return 0

    if len(sys.argv) < 3:
        print(__doc__.strip())
        return 2
    agent = sys.argv[2]
    path = claim_path(agent)

    if cmd == 'open':
        task = sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith('--') else None
        if not task:
            print("open requires <task-id>")
            return 2
        hours = float(arg('--hours', '24'))
        paths = [p for p in (arg('--paths', '') or '').split(',') if p]
        lines = ['---', f'agent: {agent}', f'task: {task}', 'status: active',
                 f"worktree: {arg('--worktree', 'main')}", f'base_commit: {head_commit()}']
        if paths:
            lines.append('allowed_paths:')
            lines += [f'  - {p}' for p in paths]
        lines += [f'lease_expires: {iso(now() + datetime.timedelta(hours=hours))}',
                  f'updated: {iso(now())}', '---', '', f'# Claim: {agent} -> {task}', '']
        if os.path.exists(path):
            old = open(path, encoding='utf-8').read()
            if 'status: active' in old:
                print(f"agent '{agent}' already has an ACTIVE claim -- release it first ({path})")
                return 1
            arch = os.path.join(ROADMAP, 'archive', 'claims')
            os.makedirs(arch, exist_ok=True)
            os.replace(path, os.path.join(arch, f"CLAIM-{agent}-{iso(now()).replace(':', '')}.md"))
        try:
            fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError:
            print(f"agent '{agent}' already has a claim file -- release or renew it ({path})")
            return 1
        with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as f:
            f.write('\n'.join(lines))
        print(path.replace('\\', '/'))
        return 0

    if cmd in ('renew', 'release'):
        if not os.path.exists(path):
            print(f"no claim for agent '{agent}'")
            return 1
        s = open(path, encoding='utf-8').read()
        import re
        if cmd == 'renew':
            hours = float(arg('--hours', '24'))
            s = re.sub(r'^lease_expires:.*$', f'lease_expires: {iso(now() + datetime.timedelta(hours=hours))}',
                       s, count=1, flags=re.M)
        else:
            s = re.sub(r'^status: active$', 'status: released', s, count=1, flags=re.M)
        s = re.sub(r'^updated:.*$', f'updated: {iso(now())}', s, count=1, flags=re.M)
        open(path, 'w', encoding='utf-8', newline='\n').write(s)
        print(f'{cmd}ed {agent}')
        return 0

    print(__doc__.strip())
    return 2


if __name__ == '__main__':
    sys.exit(main())
