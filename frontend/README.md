# Astrovia frontend

React, Tailwind CSS, and Firebase Authentication frontend for Astrovia.

## Local development

```bash
npm install
npm run dev
```

The site runs at `http://localhost:5173` and expects the API at `http://localhost:5000/api`.

Copy `.env.example` to `.env` and add the Firebase web application configuration. This configuration is public client configuration; the Firebase Admin service account stays in the backend only.

## Enable sign-in methods

In Firebase Console, open **Authentication → Sign-in method** and enable:

- Email/Password
- Google
- Apple

Then open **Authentication → Settings → Authorized domains** and ensure `localhost` is listed.

Apple also requires configuration in the Apple Developer portal: a Services ID, Sign in with Apple enabled, and the callback URL shown by Firebase. Add the generated Apple Team ID, Key ID, private key, and Services ID to the Apple provider settings in Firebase.

## Account flow

- `/login` supports account creation, email login, password reset, Google, and Apple.
- `/account` is protected and lets the signed-in user edit their profile.
- `/profile/:userId` is the public profile page.
- Firebase supplies the ID token. The frontend sends it to the Astrovia API as a Bearer token.
