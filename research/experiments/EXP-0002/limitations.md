# Limitations & threats to validity (EXP-0002)

## Study limitations

1. **Corpus size:** only two repositories; results may not generalize to all JS/TS ecosystems.
2. **Single experimenter / session:** questions were posed by the FFVS authors/agents, not an independent developer sample (threat to ecological validity).
3. **No timed controlled comparison** against editor+grep in this run (EXP-0002 planned that; this execution focused on capability cataloging). EXP-0002b could add timed tasks.
4. **Temporary clones:** ephemeral paths; reproducibility requires re-cloning the recorded commits.
5. **Shallow clone:** `--depth 1`; history questions were out of scope anyway.
6. **Centrality/cycles** computed with a helper script, not CLI—metrics reflect current (broken) edges.

## Model limitations observed

- No CALLS / CFG / type-aware binding.
- Import resolver incomplete for real Node/TS conventions.
- Ambiguous entity lookup for path-like names.
- No FILTER/SEARCH/RANK in CLI.
- Index includes non-product paths (docs, bench, configs) without project “include” filters.
- Some TS files fail Babel parse (7 in zod).

## Threats to validity

| Threat | Risk | Mitigation used |
|--------|------|-----------------|
| Confirmation bias | Prefer questions FFVS can answer | Included dependency/impact/call questions expected to stress the model |
| Fixture leakage | Overstate impact quality | Separated control fixture Q-022 from OSS results |
| Measurement error | Mis-count YES/PARTIAL/NO | Catalogued per-question with operations actually run |
| External validity | Two repos only | Documented; recommend more corpora later |
| Tooling version drift | Future FFVS changes alter answers | Pinned FFVS commit `da12caf` and repo SHAs |

## Ethical / licensing

Analyzed public OSS under their licenses; did not redistribute their source inside FFVS.
