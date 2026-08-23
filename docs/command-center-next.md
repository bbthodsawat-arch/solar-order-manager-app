# Command Center — Native Workspace Migration

## Goal
Make the Command Center a reliable control plane with six domains, deterministic registry health, one permission boundary, and native workspaces instead of legacy-only launch surfaces.

## Completed
- Registry health detects duplicate command IDs, invalid domains, and missing workspace migration status.
- Quick Actions and navigation use one permission-filtered registry.
- Recoverable empty states exist for denied/empty search results.
- Business + Catalog workspaces are integrated.
- Experience, Automation, Security, and System workspaces are mounted as native Command Center surfaces.
- Business Configuration is now a native workspace backed by the existing ConfigManager persistence path.
- Catalog Assets is now a native workspace backed by the existing AssetManager persistence and depreciation logic.
- All 13 registered commands are now `native`; no command remains `legacy` or `planned`.
- Command Center regression validates all six domains, native workspace mounting, health, permissions, and zero-legacy boundary.
- Production build continues to run the Command Center regression gate before Vite compilation.

## Migration boundary
- **Native:** all 13 registered commands across business, catalog, experience, automation, security, and system.
- **Legacy:** none.
- **Planned:** none.

## Safety
UI permission checks are UX guards only. Destructive system operations retain their own authorization checks, confirmation requirements, and audit trail at the service layer.

## Verification
- TypeScript and Command Center regression are part of the quality workflow.
- Registry health is deduplicated after extensions are merged into the Command Center shell.
- No claim of Production rollout is made until Vercel reports a READY deployment for the current `main` commit.
- The release gate must verify the deployed commit SHA matches `main` before production is considered complete.

## Release Gate
1. GitHub Actions must run `typecheck`, Command Center regression, and production build for the current `main` commit.
2. Vercel must create a Production deployment from that same commit and report `READY`.
3. Production smoke verification must confirm the Command Center route loads and the native workspace boundary remains intact.
4. A deployment built from an older commit must never be treated as the release candidate.

## Next
1. Add browser-level smoke coverage for command search, permission filtering, and workspace activation.
2. Promote the resulting `main` commit through Vercel and verify production smoke endpoints.
3. Continue improving native workspace UX without reintroducing legacy launch surfaces.
