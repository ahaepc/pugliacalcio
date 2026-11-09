"""Lists Swedish data texts that have no Italian or English translation in data/site.json.
Run from the repo root: python3 tools/check_texts.py  (exit code 1 if anything is missing)."""
import json, sys
m = json.load(open('data/matches.json'))
v = json.load(open('data/venues.json'))
s = json.load(open('data/site.json'))
T = s.get('texts', {})
need = set()
for r in m:
    for f in ('note', 'source'):
        if r.get(f): need.add(r[f])
for r in v:
    for f in ('venue_status', 'capacity_note'):
        if r.get(f): need.add(r[f])
    lbl = r.get('info_label') or ''
    if lbl and not lbl.startswith('Wikipedia'): need.add(lbl)
missing = sorted(t for t in need if not (T.get(t, {}).get('it') and T.get(t, {}).get('en')))
unused = sorted(t for t in T if t not in need)
print(f'{len(need)} texts in use, {len(missing)} missing a translation, {len(unused)} unused translations')
for t in missing: print('MISSING:', t)
for t in unused: print('UNUSED:', t)
sys.exit(1 if missing else 0)
