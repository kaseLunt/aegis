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

# Windows consoles default to cp1252; never let an emoji in validated content crash the gate.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

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


def fingerprint(globs, own_rel):
    """sha256 over staged-index blob identities of the invalidated_by path set.

    Uses `git ls-files -s` (index blob hashes), so the fingerprint reflects the bytes that
    commits carry. The item's own file is excluded (stamping it would loop the hash).
    """
    import hashlib
    specs = [(':(glob)' + g) if any(c in g for c in '*?[') else g for g in globs if g]
    if not specs:
        return 'sha256:' + hashlib.sha256(b'').hexdigest()[:16]
    out = subprocess.run(['git', 'ls-files', '-s', '--'] + specs,
                         cwd=REPO, capture_output=True, text=True).stdout
    lines = sorted(l for l in out.replace('\\', '/').split('\n')
                   if l and not l.endswith('\t' + own_rel))
    return 'sha256:' + hashlib.sha256('\n'.join(lines).encode()).hexdigest()[:16]


def stamp(target_id):
    for path in glob.glob(os.path.join(ROADMAP, 'work', '*.md')):
        text = open(path, encoding='utf-8').read()
        fm = parse_fm(text)
        if not fm or fm.get('id') != target_id:
            continue
        rel = os.path.relpath(path, REPO).replace('\\', '/')
        fp = fingerprint(fm.get('invalidated_by') or [], rel)
        if re.search(r'^evidence_fingerprint:.*$', text, re.M):
            text = re.sub(r'^evidence_fingerprint:.*$', f'evidence_fingerprint: {fp}', text, count=1, flags=re.M)
        else:
            end = text.find('\n---', 3)
            text = text[:end] + f'\nevidence_fingerprint: {fp}' + text[end:]
        open(path, 'w', encoding='utf-8', newline='\n').write(text)
        print(f"stamped {target_id}: {fp}  ({rel}) -- remember to `git add` it")
        return 0
    print(f"--stamp: no work file with id '{target_id}'")
    return 1


if len(sys.argv) >= 3 and sys.argv[1] == '--stamp':
    sys.exit(stamp(sys.argv[2]))

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
            objs[oid] = (rel, fm, text)

ids = set(objs)
phase_ids = set(re.findall(r'^\|\s*(P\d+)\s*\|', roadmap_text, re.M))

# D-004 rule 1: the ROADMAP work-ladder Status column is a COPY of work-item frontmatter
# status. Copies of derived/stored facts must be tool-validated or they drift.
in_ladder = False
for ln in roadmap_text.split('\n'):
    if ln.startswith('## '):
        in_ladder = ln.lower().startswith('## work ladder')
        continue
    m = re.match(r'^\|\s*(W[\w.\-]+)\s*\|', ln) if in_ladder else None
    if not m:
        continue
    cells = [c.strip() for c in ln.strip().strip('|').split('|')]
    lid, last = m.group(1), cells[-1]
    if lid in objs:
        st = objs[lid][1].get('status', '')
        if st and st not in last:
            errors.append(f"ROADMAP ladder row '{lid}' says '{last}' but {objs[lid][0]} has status:{st} (copy drifted)")
    elif 'unfiled' not in last.lower():
        errors.append(f"ROADMAP ladder row '{lid}' has no work file -- mark it 'unfiled' or create roadmap/work/{lid}-*.md")
# W0B: STATUS.md is mandatory; exactly one phase may be in progress.
if status_fm is None:
    errors.append("roadmap/STATUS.md missing or has no frontmatter (active_phase / active_task)")
inprog = [p for p, row in re.findall(r'^\|\s*(P\d+)\s*\|(.*)$', roadmap_text, re.M)
          if 'in progress' in row.lower()]
if len(inprog) != 1:
    errors.append(f"exactly one phase must be 'In progress' in ROADMAP.md; found {inprog or 'none'}")
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
for oid, (rel, fm, _txt) in objs.items():
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
        # W0B: evidence attestation. Achieved items carry a tool-written fingerprint of their
        # invalidated_by inputs; a mismatch means the evidence no longer covers current bytes.
        if fm.get('status') == 'achieved':
            stored = fm.get('evidence_fingerprint')
            if not stored:
                errors.append(f"{rel}: achieved without evidence_fingerprint (re-verify, then: doctor.py --stamp {oid})")
            else:
                current = fingerprint(fm.get('invalidated_by') or [], rel)
                if current != stored:
                    errors.append(f"{rel}: evidence INVALIDATED -- invalidated_by inputs changed since attestation "
                                  f"(re-run acceptance, then: doctor.py --stamp {oid})")
        # W0B: dependencies must be proven before work starts on top of them.
        if fm.get('status') == 'active':
            for dep in (fm.get('depends_on') or []):
                if dep in objs and objs[dep][1].get('type') in WORKLIKE and objs[dep][1].get('status') != 'achieved':
                    errors.append(f"{rel}: active but depends_on '{dep}' is status:{objs[dep][1].get('status')} (not achieved)")
        # D-004 rule 2: the active work item must carry a resumable handoff.
        if fm.get('status') == 'active':
            body = objs[oid][2]
            hm = re.search(r'^## Handoff\s*$', body, re.M)
            if not hm:
                errors.append(f"{rel}: active work item missing '## Handoff' section (next / read_first / hazards)")
            else:
                seg = body[hm.end():]
                nxt = re.split(r'^## ', seg, maxsplit=1, flags=re.M)[0]
                for key in ('next:', 'read_first:', 'hazards:'):
                    if not re.search(r'^\s*[-*]?\s*' + key, nxt, re.M):
                        errors.append(f"{rel}: '## Handoff' missing '{key}' (cold session must resume in minutes)")
                if len(nxt.strip()) < 120:
                    errors.append(f"{rel}: '## Handoff' too thin to resume from ({len(nxt.strip())} chars)")
    elif t == 'decision':
        # W0B: acceptance is a human-owner act. Accepted decisions carry approved_by.
        if fm.get('status') == 'accepted' and not fm.get('approved_by'):
            errors.append(f"{rel}: decision is 'accepted' without approved_by (HITL -- owner ratifies, agent records)")
    else:
        advisory += sum(1 for r in (fm.get('depends_on') or []) if r and r not in ids)
    rw = fm.get('review_when')
    if rw:
        if not RW_RE.match(str(rw)):
            warnings.append(f"{rel}: review_when '{rw}' not typed (phase:ID:entry|exit / date:YYYY-MM-DD / now / event:slug)")
        elif due(str(rw)):
            infos.append(f"REVIEW-DUE: {oid} -- review_when={rw}  ({rel})")

active_work = [o for o, (r, fm, _t) in objs.items() if fm.get('type') in WORKLIKE and fm.get('status') == 'active']
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
    if at and at in ids and active_work and at not in active_work:
        errors.append(f"active_task '{at}' is not an active work object {active_work}")

# D-006 claims model: WIP=1 is PER AGENT. Every active work item needs exactly one active,
# unexpired claim; each agent holds at most one active claim; claim scope must be a subset
# of the task's declared scope.
claims = []
for cpath in glob.glob(os.path.join(ROADMAP, 'claims', 'CLAIM-*.md')):
    crel = os.path.relpath(cpath, REPO).replace('\\', '/')
    cfm = parse_fm(open(cpath, encoding='utf-8').read())
    if not cfm or 'agent' not in cfm:
        errors.append(f"{crel}: claim file missing frontmatter/agent")
        continue
    claims.append((crel, cfm))
now_utc = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
agents_seen = {}
claimed_tasks = {}
for crel, cfm in claims:
    if cfm.get('status') != 'active':
        continue
    agent, task = cfm.get('agent'), cfm.get('task')
    if agent in agents_seen:
        errors.append(f"{crel}: agent '{agent}' holds more than one active claim (also {agents_seen[agent]})")
    agents_seen[agent] = crel
    exp = cfm.get('lease_expires', '')
    if not exp or exp < now_utc:
        errors.append(f"{crel}: lease expired ({exp or 'missing'}) -- renew (claim.py renew {agent}) or release")
    if task not in ids or objs[task][1].get('type') not in WORKLIKE:
        errors.append(f"{crel}: claim task '{task}' is not a work-like object")
        continue
    if objs[task][1].get('status') != 'active':
        errors.append(f"{crel}: claim task '{task}' is status:{objs[task][1].get('status')}, not active")
    claimed_tasks.setdefault(task, []).append(crel)
    task_paths = objs[task][1].get('allowed_paths') or []
    for p in (cfm.get('allowed_paths') or []):
        if p not in task_paths:
            errors.append(f"{crel}: claim path '{p}' not declared in {task}'s allowed_paths (claims may only narrow)")
for w in active_work:
    n = len(claimed_tasks.get(w, []))
    if n != 1:
        errors.append(f"active work item '{w}' has {n} active claims (need exactly 1 -- claim.py open <agent> {w})")
for oid, (rel, fm, _txt) in objs.items():
    if fm.get('status') == 'active' and (fm.get('blocked_by') or []):
        errors.append(f"{rel}: active but blocked_by={fm.get('blocked_by')}")

graph = {o: [r for r in (fm.get('depends_on') or []) if r in objs and objs[r][1].get('type') in WORKLIKE]
         for o, (rel, fm, _t) in objs.items() if fm.get('type') in WORKLIKE}
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
