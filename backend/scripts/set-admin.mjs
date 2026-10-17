import "dotenv/config";

const { auth, requireAdminCredentials } = await import(
  "../src/config/firebase.js"
);

const revoke = process.argv.includes("--revoke");
const uid = process.argv.slice(2).find((argument) => !argument.startsWith("--"));

if (!uid || uid.length > 128) {
  console.error(
    `Usage: npm run admin:${revoke ? "revoke" : "grant"} -- <firebase-uid>`,
  );
  process.exit(1);
}

try {
  requireAdminCredentials();
  const user = await auth.getUser(uid);
  if (!revoke && user.email && !user.emailVerified) {
    throw new Error("Verify this account's email before granting admin access.");
  }

  const claims = { ...(user.customClaims || {}) };
  if (revoke) delete claims.admin;
  else claims.admin = true;

  await auth.setCustomUserClaims(uid, claims);
  const updatedUser = await auth.getUser(uid);
  if (Boolean(updatedUser.customClaims?.admin) === !revoke) {
    console.log(`Admin access ${revoke ? "revoked" : "granted"} successfully.`);
  } else {
    throw new Error("Firebase did not persist the requested admin claim.");
  }
} catch (error) {
  console.error(`Could not update admin access: ${error.message}`);
  process.exitCode = 1;
}

process.exit();
