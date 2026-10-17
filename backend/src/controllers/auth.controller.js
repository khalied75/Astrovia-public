import { upsertUserFromToken } from "../services/user.service.js";

export async function getCurrentUser(req, res) {
  const user = await upsertUserFromToken(req.user);
  res.json({ success: true, data: user });
}
