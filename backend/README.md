# Astrovia API

Express and Firebase Admin backend for the Astrovia astronomy community.

## Local setup

1. Use Node.js 20 or newer.
2. Copy `.env.example` to `.env` and keep `CLIENT_URL=http://localhost:5173`.
3. In Firebase Console, open **Project settings → Service accounts → Generate new private key**.
4. Put the complete JSON value in `FIREBASE_SERVICE_ACCOUNT_JSON`. Never commit that value.
5. Run `npm install`, then `npm run dev`.

The local API is available at `http://localhost:5000`; check it at `GET /api/health`.

The Firebase web configuration (`apiKey`, `authDomain`, and similar values) belongs in the frontend. The API needs a Firebase Admin service account so it can verify Firebase ID tokens and access Firestore securely.

## Authentication

The frontend signs users in with Firebase Authentication. Send the returned ID token with protected requests:

```http
Authorization: Bearer <firebase-id-token>
```

## Routes

| Method | Route | Authentication | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | No | API health |
| GET | `/api/auth/me` | Yes | Sync and return current user |
| GET | `/api/users/:userId` | No | Public profile |
| PATCH | `/api/users/me/profile` | Yes | Update current profile |
| POST | `/api/uploads/images` | Yes | Upload one post image (`multipart/form-data`, field `image`) |
| GET | `/api/posts?limit=10&cursor=id` | No | Paginated home feed |
| GET | `/api/posts/:postId` | No | Single post |
| POST | `/api/posts` | Yes | Create post |
| PATCH | `/api/posts/:postId` | Yes, owner | Update post |
| DELETE | `/api/posts/:postId` | Yes, owner | Delete post and its children |
| POST | `/api/posts/:postId/like` | Yes | Toggle like |
| GET | `/api/posts/:postId/comments` | No | Post comments |
| POST | `/api/posts/:postId/comments` | Yes | Add comment |
| DELETE | `/api/posts/:postId/comments/:commentId` | Yes | Delete own comment |
| GET | `/api/admin-access/status` | Admin | Check whether the second security password is configured |
| POST | `/api/admin-access/setup` | Admin | Create the hashed admin security password |
| POST | `/api/admin-access/unlock` | Admin | Create a 30-minute admin security session |
| GET | `/api/reports` | Admin + security session | Review reports |

The admin security password is never stored as plain text. The API stores a
salted `scrypt` hash in `adminSecurity/{uid}`. Short-lived session tokens are
also hashed before they are written to `adminAccessSessions`; the browser keeps
the original token only in `sessionStorage`.

Example post body:

```json
{
  "content": "Jupiter is bright above Amman tonight.",
  "topic": "Observations",
  "tags": ["Jupiter", "Amman"],
  "mediaUrl": "https://example.com/jupiter.jpg",
  "mediaType": "image"
}
```

Firestore collections are created automatically on the first write: `users`, `posts`, and the `comments` and `likes` subcollections under each post.

## Container deployment

The repository includes `backend/Dockerfile` for services such as Northflank.
Use `backend` as the Docker build context and `backend/Dockerfile` as the
Dockerfile path. The container listens on port `5000`; use `/api/health` as its
health-check path.

Set these runtime environment variables in the hosting service:

```ini
CLIENT_URL=https://astrovia.world,https://www.astrovia.world
FIREBASE_PROJECT_ID=astrovia-cde66
FIREBASE_DATABASE_URL=https://astrovia-cde66-default-rtdb.firebaseio.com
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET=astrovia-media
CLOUDFLARE_R2_PUBLIC_URL=https://your-public-r2-domain
```

Store the complete Firebase service-account JSON as a secret variable named
`FIREBASE_SERVICE_ACCOUNT_JSON`. Do not add the JSON key to GitHub or to the
Docker image.

After the service is healthy, associate `api.astrovia.world`, then set the
frontend value below, rebuild, and deploy Firebase Hosting:

```ini
VITE_API_URL=https://api.astrovia.world/api
```
