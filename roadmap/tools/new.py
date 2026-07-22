#!/usr/bin/env python3
"""One-command typed-object capture (D-004 rule 3: capture must be cheap or it won't happen).

Usage: python roadmap/tools/new.py <idea|insight|decision|risk> "title text"

Creates the file with valid frontmatter and the next free id, prints the path. Fill the body
afterwards. Ideas land as status:inbox with a 14-day review date so triage is signal, not noise.
"""
import datetime
import glob
import os
import re
import sys

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

ROADMAP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Decisions are born 'proposed': acceptance is a human-owner act recorded via approved_by
# (doctor blocks accepted-without-approved_by). D-004 rule on HITL.
TYPES = {
    'idea': ('ideas', 'IDEA', 'inbox'),
    'insight': ('insights', 'INS', 'active'),
    'decision': ('decisions', 'D', 'proposed'),
    'risk': ('risks', 'R', 'open'),
}


def next_id(prefix):
    n = 0
    for path in glob.glob(os.path.join(ROADMAP, '**', '*.md'), recursive=True):
        for m in re.finditer(r'^id:\s*' + prefix + r'-(\d+)', open(path, encoding='utf-8').read(), re.M):
            n = max(n, int(m.group(1)))
    return f"{prefix}-{n + 1:03d}"


def main(argv):
    if len(argv) < 2 or argv[0] not in TYPES:
        print(__doc__.strip())
        return 2
    kind, title = argv[0], ' '.join(argv[1:]).strip()
    subdir, prefix, status = TYPES[kind]
    oid = next_id(prefix)
    slug = re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', title.lower())).strip('-')[:48]
    today = datetime.date.today()
    review = (today + datetime.timedelta(days=14)).isoformat()
    path = os.path.join(ROADMAP, subdir, f"{oid}-{slug}.md")
    lines = ['---', f'id: {oid}', f'type: {kind}', f'title: {title}', f'status: {status}']
    if kind == 'decision':
        lines += [f'date: {today.isoformat()}', 'supersedes: []']
    else:
        lines += ['informs: []', f'review_when: date:{review}']
    lines += [f'updated: {today.isoformat()}', '---', '', f'# {oid} — {title}', '',
              '[context / body — fill in now, not later]', '']
    os.makedirs(os.path.dirname(path), exist_ok=True)
    try:
        # O_EXCL closes the check-then-write race between concurrent captures.
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        print(f"refusing to overwrite {path}")
        return 1
    with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines))
    print(path.replace('\\', '/'))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
