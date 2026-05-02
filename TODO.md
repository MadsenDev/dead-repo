# TODO

## Priority 1

- Rework GitHub auth so the shipped desktop app does not depend on a protected client secret.

## Priority 2

- Improve connected-mode error and empty states for:
  - no repos
  - auth failure
  - partial enrichment failure
  - rate limiting

## Priority 3

- Decide whether deep repo analysis should be:
  - always-on progressive enrichment, or
  - an optional forensic mode
- Replace remaining mock/demo-only sections in connected mode where practical, especially outdated dependency analysis.

## Notes

- Do not add user-facing scan-depth controls unless the product benefit is clear.
- Prefer enough real fetching for the app to feel legitimate, then progressively enrich additional details.
