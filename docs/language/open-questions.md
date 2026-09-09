## Open questions (updated for v0.1)

Resolved in 0.6.0:

- Pipeline threads EntitySet (map-all) rather than requiring `pick`.
- Default output lists entities; `describe` adds summaries.
- Traverse defaults direction from sugar; optional `inbound`/`outbound`.
- Keywords are lower-case.
- Stages are whitespace-separated (no `|` yet).

Still open:

1. Should `traverse calls` default-filter to RESOLVED only?
2. Describe depth vs full `inspect` parity?
3. When to add `path` / `impact` stages?
4. Entity disambiguation syntax when names collide inside a pipeline?
5. Language stability policy beyond ADR-0019?
