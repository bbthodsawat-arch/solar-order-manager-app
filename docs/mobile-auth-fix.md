# Mobile Firebase Auth fix

Firebase Auth uses browser session persistence to avoid IndexedDB persistence lifecycle issues in Android custom-tab/mobile browser environments.

The app still uses Firebase Authentication and Firestore as the primary backend.
