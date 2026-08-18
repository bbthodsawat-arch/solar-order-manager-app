# Build verification

This branch is for removing stale Supabase dependencies and verifying the Firebase/Firestore production build.

Requirements:
- Firebase/Firestore remains the database/auth stack.
- Do not modify production until the build and runtime checks pass.
- Production login must remain intact.
