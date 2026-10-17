import {
  adminPasswordStatus,
  createAdminPassword,
  deleteAdminSession,
  unlockAdminAccess,
} from "../services/adminAccess.service.js";

export async function status(req, res) {
  res.json({
    success: true,
    data: await adminPasswordStatus(req.user.uid),
  });
}

export async function setup(req, res) {
  res.status(201).json({
    success: true,
    data: await createAdminPassword(req.user.uid, req.body.password),
  });
}

export async function unlock(req, res) {
  res.json({
    success: true,
    data: await unlockAdminAccess(req.user.uid, req.body.password),
  });
}

export function verify(_req, res) {
  res.json({ success: true, data: { valid: true } });
}

export async function lock(req, res) {
  await deleteAdminSession(req.user.uid, req.get("X-Admin-Session"));
  res.status(204).send();
}
