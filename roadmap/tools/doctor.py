#!/usr/bin/env python3
"""Control-plane doctor -- structural validator for roadmap/.

Catches the drift an unenforced constitution accumulates: dangling references, NOW pointing at
non-existent / non-active / wrong-phase objects, >1 active task, blocked-and-active, dependency
cycles, hand-set evidence levels, untyped review triggers. Surfaces review-due items and the
git-tracked state of authoritative files.

BOOTSTRAP validator. Evidence fingerprinting + per-type lifecycle automation are staged hardening
(track them as a work item). Usage: python roadmap/tools/doctor.py  (exit 1 on errors)
"""
import os, re, sys, glob, subprocess, datetime

ROADMAP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(ROADMAP)
WORKLIKE = {"work", "experiment", "milestone"}
RW_RE = re.compile(r"^(phase:[A-Za-z0-9-]+:(entry|exit)|date:\d{4}-\d{2}-\d{2}|now|event:[a-z0-9-]+)$")

errors, warnings, infos = [], [], []


def strip_comment(s):
    inq = None
    for i, ch in enumerate(s):
        if ch in "\"'":
            inq = None if inq == ch else (inq or ch)
        elif ch == '#' and inq is None and (i == 0 or s[i - 1] == ' '):
            return s[:i].strip()
    return s.strip()


def unq(s):
    s = s.strip()
    return s[1:-1] if len(s) >= 2 and s[0] in "\"'" and s[-1] == s[0] else s


def parse_fm(text):
    if not text.startswith('---'):
        return None
    end = text.find('\n---', 3)
    if end == -1:
        return None
    lines = text[3:end].strip('\n').split('\n')
    d, i = {}, 0
    while i < len(lines):
        ln = lines[i]
        if not ln.strip() or ln.strip().startswith('#') or ':' not in ln:
            i += 1
            continue
        k, _, v = ln.partition(':')
        k, v = k.strip(), v.strip()
        if v == '' and i + 1 < len(lines) and lines[i + 1].lstrip().startswith('- '):
            items, j = [], i + 1
            while j < len(lines) and lines[j].lstrip().startswith('- '):
                items.append(unq(strip_comment(lines[j].lstrip()[2:])))
                j += 1
            d[k] = items
            i = j
            continue
        v = strip_comment(v)
        if v.startswith('[') and v.endswith(']'):
            d[k] = [unq(x) for x in v[1:-1].split(',') if x.strip()]
        else:
            d[k] = unq(v)
        i += 1
    return d


objs, status_fm, roadmap_text = {}, None, ''
found_files = []
for path in glob.glob(os.path.join(ROADMAP, '**', '*.md'), recursive=True):
    rel = os.path.relpath(path, REPO).replace('\\', '/')
    if '/archive/' in rel:
        continue
    found_files.append(rel)
    text = open(path, encoding='utf-8').read()
    fm = parse_fm(text)
    base = os.path.basename(path)
    if base == 'STATUS.md':
        status_fm = fm
    if base == 'ROADMAP.md':
        roadmap_text = text
    if fm and 'id' in fm:
        oid = fm['id']
        if oid in objs:
            errors.append(f"duplicate id '{oid}' ({rel} and {objs[oid][0]})")
        else:
            objs[oid] = (rel, fm)

ids = set(objs)
phase_ids = set(re.findall(r'^\|\s*(P\d+)\s*\|', roadmap_text, re.M))
ap = status_fm.get('active_phase') if status_fm else None
try:
    today = datetime.date.today().isoformat()
except Exception:
    today = '9999-12-31'


def due(rw):
    if rw == 'now':
        return True
    if rw.startswith('date:'):
        return rw[5:] <= today
    if rw.startswith('phase:'):
        p = rw.split(':')
        return len(p) == 3 and p[1] == ap
    return False


advisory = 0
for oid, (rel, fm) in objs.items():
    t = fm.get('type')
    for ref in (fm.get('informs') or []):
        if ref and ref not in ids:
            errors.append(f"{rel}: informs -> missing id '{ref}'")
    for ref in (fm.get('supersedes') or []):
        if ref and ref not in ids:
            errors.append(f"{rel}: supersedes -> missing id '{ref}'")
    if t in WORKLIKE:
        for f in ('depends_on', 'blocked_by'):
            for ref in (fm.get(f) or []):
                if ref and ref not in ids:
                    errors.append(f"{rel}: {f} -> missing id '{ref}'")
        if 'evidence_target' not in fm:
            errors.append(f"{rel}: work-like object missing evidence_target")
        if 'evidence_level' in fm:
            errors.append(f"{rel}: evidence_level is hand-set (derived field -- use evidence_target)")
    else:
        advisory += sum(1 for r in (fm.get('depends_on') or []) if r and r not in ids)
    rw = fm.get('review_when')
    if rw:
        if not RW_RE.match(str(rw)):
            warnings.append(f"{rel}: review_when '{rw}' not typed (phase:ID:entry|exit / date:YYYY-MM-DD / now / event:slug)")
        elif due(str(rw)):
            infos.append(f"REVIEW-DUE: {oid} -- review_when={rw}  ({rel})")

active_work = [o for o, (r, fm) in objs.items() if fm.get('type') in WORKLIKE and fm.get('status') == 'active']
if status_fm:
    at = status_fm.get('active_task')
    if at and at != 'none':
        if at not in ids:
            errors.append(f"STATUS active_task '{at}' has no object")
        else:
            afm = objs[at][1]
            if afm.get('status') != 'active':
                errors.append(f"STATUS active_task '{at}' is status:{afm.get('status')}, not active")
            if afm.get('phase') and ap and afm.get('phase') != ap:
                errors.append(f"active_task '{at}' phase {afm.get('phase')} != active_phase {ap}")
    if ap and ap not in phase_ids:
        errors.append(f"STATUS active_phase '{ap}' not in ROADMAP phases {sorted(phase_ids)}")
    if len(active_work) > 1:
        errors.append(f"more than one active work object: {active_work}")
    if at and at in ids and active_work and at not in active_work:
        errors.append(f"active_task '{at}' is not the active work object {active_work}")
for oid, (rel, fm) in objs.items():
    if fm.get('status') == 'active' and (fm.get('blocked_by') or []):
        errors.append(f"{rel}: active but blocked_by={fm.get('blocked_by')}")

graph = {o: [r for r in (fm.get('depends_on') or []) if r in objs and objs[r][1].get('type') in WORKLIKE]
         for o, (rel, fm) in objs.items() if fm.get('type') in WORKLIKE}
color = {}
def dfs(n, stack):
    color[n] = 1
    for m in graph.get(n, []):
        if color.get(m, 0) == 1:
            errors.append("dependency cycle: " + " -> ".join(stack + [m]))
        elif color.get(m, 0) == 0:
            dfs(m, stack + [m])
    color[n] = 2
for n in list(graph):
    if color.get(n, 0) == 0:
        dfs(n, [n])

try:
    out = subprocess.run(['git', 'ls-files', 'roadmap'], cwd=REPO, capture_output=True, text=True).stdout
    tracked = {t for t in out.replace('\\', '/').split('\n') if t.endswith('.md')}
    fset = set(found_files)
    untracked = fset - tracked
    infos.append(f"tracked: {len(fset & tracked)}/{len(fset)} roadmap files in git"
                 + (f" -- {len(untracked)} UNTRACKED (commit to make durable)" if untracked else ""))
except Exception:
    pass
if advisory:
    infos.append(f"{advisory} advisory non-id preconditions in idea/insight depends_on (formalize at triage)")

print(f"control-plane doctor: {len(objs)} objects, phases {sorted(phase_ids)}, active_phase {ap}")
for m in infos:
    print("  INFO: ", m)
for w in warnings:
    print("  WARN: ", w)
for e in errors:
    print("  ERROR:", e)
print(f"\n{'FAIL' if errors else 'OK'} -- {len(errors)} error(s), {len(warnings)} warning(s), {len(infos)} info")
sys.exit(1 if errors else 0)
