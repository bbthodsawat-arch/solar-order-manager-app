# TypeScript release typecheck

The release pipeline now runs the strict TypeScript compiler against `tsconfig.release.json` before production build.

This file is intentionally kept as a short-lived tracking note while the existing nullable Firestore/model mismatches are normalized. New production code must pass the strict release typecheck; do not suppress errors with `any` or blanket `@ts-ignore`.
