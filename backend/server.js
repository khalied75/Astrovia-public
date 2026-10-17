import "dotenv/config";
import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { hasAdminCredentials } from "./src/config/firebase.js";

const server = app.listen(env.port, () => {
  console.log(`Astrovia API listening on port ${env.port}`);
  if (!hasAdminCredentials) {
    console.warn(
      "Firebase Admin credentials are missing. Auth tokens can be verified, but Firestore and Storage routes will return 503.",
    );
  }
});

function shutdown(signal) {
  console.log(`${signal} received. Closing HTTP server...`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
