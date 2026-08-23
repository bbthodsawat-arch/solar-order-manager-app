# Command Center — Next Development Slice

## Goal
Define the next implementation slice for the Command Center without changing production behavior yet.

## Scope
- Control Plane overview
- Quick Actions
- Permission-aware navigation
- Secure Document Workspace guard
- Business migration registry
- Permission-boundary tests
- Quality gate

## Next slice
1. Surface registry health and migration state in the Control Plane.
2. Make Quick Actions reflect the same permission/availability model as navigation.
3. Add explicit empty/error/loading states for registry-backed panels.
4. Keep security checks server/data-layer authoritative; UI checks are only UX guards.
5. Extend the quality gate with deterministic registry and permission-boundary assertions.

## Acceptance criteria
- Command Center shows registry health without exposing unauthorized actions.
- Quick Actions never present an action the current permission model rejects.
- Missing/failed registry data renders a recoverable state instead of a blank panel.
- Tests cover allowed, denied, and missing-registry cases.
- Existing production build remains unchanged unless the implementation requires it.
