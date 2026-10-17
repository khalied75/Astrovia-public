# Astrovia

Astrovia is a social network for astronomy enthusiasts, students, researchers, and astrophotographers. Users can publish astronomy content, follow profiles, discuss posts, ask questions, exchange real-time messages, and explore interactive space simulations.

## Technology

- React, Vite, and Tailwind CSS
- Node.js and Express
- Firebase Authentication, Firestore, and Realtime Database
- Cloudflare R2 object storage
- Firebase Hosting

## Local setup

1. Install dependencies:

   ```bash
   npm install
   npm run install:all
   ```

2. Copy the environment templates:

   ```bash
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```

3. Replace the placeholder values in both `.env` files.

4. Start the frontend and backend:

   ```bash
   npm run dev
   ```

## Security

Runtime credentials are excluded from Git. Keep Firebase service-account credentials, Cloudflare R2 keys, and local `.env` files in your hosting provider's secret manager.

## Website

[astrovia.world](https://astrovia.world)
