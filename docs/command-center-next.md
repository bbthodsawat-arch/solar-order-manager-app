# Command Center — Native Workspace Migration

## Goal
Make the Command Center a reliable control plane with six domains, deterministic registry health, one permission boundary, and native workspaces instead of legacy-only launch surfaces.

## Completed
- Registry health detects duplicate command IDs, invalid domains, and missing workspace migration status.
- Quick Actions and navigation use one permission-filtered registry.
- Recoverable empty states exist for denied/empty search results.
- Business + Catalog workspaces are integrated.
- Experience, Automation, Security, and System workspaces are now mounted as native Command Center surfaces.
- Automation uses the existing Daily Reminder implementation.
- Experience uses the existing Design System / Theme Studio implementation.
- Security uses the existing Access & Login Control implementation with RBAC/Firebase policy messaging.
- System Data uses the existing Backup/Restore implementation.
- System Maintenance uses the existing authorization-gated Factory Reset implementation with confirmation and audit logging.
- Command Center regression validates all six domains and the native/legacy migration boundary.
- Production build continues to run the Command Center regression gate before Vite compilation.

## Migration boundary
- **Native:** business.profile, business.brand, business.documents, catalog.products, catalog.inventory, experience.design, automation.workflows, security.access, security.login, system.data, system.maintenance.
- **Legacy:** business.configuration, catalog.assets.
- **Planned:** none.

The two remaining legacy commands stay explicitly marked so they cannot silently become part of the native surface without a migration decision and regression coverage.

## Safety
UI permission checks are UX guards only. Destructive system operations retain their own authorization checks, confirmation requirements, and audit trail at the service layer.

## Verification
- TypeScript and Command Center regression are part of the quality workflow.
- Registry health is deduplicated after extensions are merged into the Command Center shell.
- No claim of Production rollout is made until Vercel reports a READY deployment for the current `main` commit.

## Next
1. Migrate `business.configuration` into a native configuration workspace.
2. Migrate `catalog.assets` into a native asset workspace.
3. Add browser-level smoke coverage for command search, permission filtering, and workspace activation.
4. Promote the resulting `main` commit through Vercel and verify production smoke endpoints.
