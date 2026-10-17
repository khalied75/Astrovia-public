import {
  getPublicUser,
  listConnections,
  toggleFollow,
  updateUser,
} from "../services/user.service.js";
import ApiError from "../utils/ApiError.js";
import { optionalUrl, text } from "../utils/validation.js";
import { listUserPosts } from "../services/post.service.js";

export async function showUser(req, res) {
  const user = await getPublicUser(req.params.userId, req.user?.uid);
  if (!user) throw new ApiError(404, "User not found.");
  const { email: _email, ...publicUser } = user;
  res.json({ success: true, data: publicUser });
}

export async function changeFollow(req, res) {
  res.json({
    success: true,
    data: await toggleFollow(req.user.uid, req.params.userId),
  });
}

export async function showFollowers(req, res) {
  res.json({
    success: true,
    data: await listConnections(req.params.userId, "followers"),
  });
}

export async function showFollowing(req, res) {
  res.json({
    success: true,
    data: await listConnections(req.params.userId, "following"),
  });
}

export async function showUserPosts(req, res) {
  res.json({
    success: true,
    data: await listUserPosts(req.params.userId, req.user?.uid),
  });
}

export async function editCurrentUser(req, res) {
  const username =
    req.body.username === undefined
      ? undefined
      : text(req.body.username, "username", { min: 3, max: 24 }).toLowerCase();
  if (username && !/^[a-z0-9_]+$/.test(username)) {
    throw new ApiError(400, "username can only contain letters, numbers, and underscores.");
  }

  const updates = {
    displayName: req.body.displayName === undefined ? undefined : text(req.body.displayName, "displayName", { min: 2, max: 50 }),
    username,
    bio: req.body.bio === undefined ? undefined : text(req.body.bio, "bio", { max: 240, optional: true }) || "",
    photoURL: req.body.photoURL === undefined ? undefined : optionalUrl(req.body.photoURL, "photoURL") || null,
    location:
      req.body.location === undefined
        ? undefined
        : text(req.body.location, "location", { max: 80, optional: true }) || "",
    website:
      req.body.website === undefined
        ? undefined
        : optionalUrl(req.body.website, "website") || "",
  };
  const user = await updateUser(req.user.uid, updates);
  res.json({ success: true, data: user });
}
