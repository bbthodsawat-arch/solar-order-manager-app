# Command Center — Next Development Slice

## Goal
Make the Command Center a reliable control plane: registry state is visible, permission filtering is consistent, and degraded/empty states are recoverable without exposing unauthorized actions.

## Completed slice
- Control Plane overview surfaces deterministic registry health.
- Registry health detects duplicate command IDs, invalid domains, and missing workspace migration status.
- Quick Actions and navigation use the same permission-filtered command set.
- Explicit empty states cover both no permitted commands and no permitted Quick Actions.
- Security remains authoritative outside the UI; Command Center checks are UX guards only.
- Deterministic quality checks cover healthy, degraded, duplicate-registry, allowed, and denied fixtures.

## Acceptance criteria
- Command Center shows registry health without exposing unauthorized actions. **Done**
- Quick Actions never present an action the current permission model rejects. **Done**
- Missing/failed registry data renders a recoverable state instead of a blank panel. **Done**
- Tests cover allowed, denied, healthy, degraded, and missing-registry-status cases. **Done**
- Existing production build remains unchanged unless the implementation requires it. **Done**

## Next
1. Expand native workspaces beyond the current business/catalog slice.
2. Keep every migration behind the shared registry and permission boundary.
3. Add browser-level smoke coverage for Command Center navigation once the repository browser test harness is available.
