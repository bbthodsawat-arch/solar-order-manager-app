# Google Auth Production Checklist

The production login uses Firebase Google sign-in with `signInWithRedirect()` for mobile-safe authentication.

Required Firebase Console settings:
- Authentication > Sign-in method > Google: Enabled
- Authentication > Settings > Authorized domains: include `solar-order-manager-app.vercel.app`
- Google provider configuration must have a valid support email

The application reads the existing Firebase project configuration from `firebase-applet-config.json` and does not expose private secrets.
