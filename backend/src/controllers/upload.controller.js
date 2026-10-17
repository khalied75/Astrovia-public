import {
  saveMessageImage,
  savePostImage,
  saveProfileImage,
} from "../services/upload.service.js";

export async function uploadPostImage(req, res) {
  const image = await savePostImage(req.file, req.user.uid);
  res.status(201).json({ success: true, data: image });
}

export async function uploadProfileImage(req, res) {
  const image = await saveProfileImage(req.file, req.user.uid);
  res.status(201).json({ success: true, data: image });
}

export async function uploadMessageImage(req, res) {
  const image = await saveMessageImage(req.file, req.user.uid);
  res.status(201).json({ success: true, data: image });
}
