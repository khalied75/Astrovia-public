import * as postService from "../services/post.service.js";
import ApiError from "../utils/ApiError.js";
import { optionalUrl, tags, text } from "../utils/validation.js";

function postInput(body, partial = false) {
  let mediaUrls;
  if (body.mediaUrls === undefined) {
    if (body.mediaUrl !== undefined) {
      const legacyUrl = optionalUrl(body.mediaUrl);
      mediaUrls = legacyUrl ? [legacyUrl] : [];
    } else {
      mediaUrls = partial ? undefined : [];
    }
  } else {
    if (!Array.isArray(body.mediaUrls) || body.mediaUrls.length > 3) {
      throw new ApiError(400, "mediaUrls must be an array of up to 3 image URLs.");
    }
    mediaUrls = [...new Set(body.mediaUrls.map((url) => optionalUrl(url)).filter(Boolean))];
  }

  return {
    content:
      partial && body.content === undefined
        ? undefined
        : text(body.content, "content", { min: 1, max: 3000 }),
    topic:
      body.topic === undefined
        ? partial
          ? undefined
          : "General"
        : text(body.topic, "topic", { max: 40 }),
    tags: body.tags === undefined && partial ? undefined : tags(body.tags),
    questionType:
      body.questionType === undefined
        ? partial
          ? undefined
          : null
        : text(body.questionType, "questionType", { max: 40 }),
    mediaUrls,
    mediaType:
      body.mediaType === undefined
        ? undefined
        : text(body.mediaType, "mediaType", { max: 20 }),
  };
}

export async function index(req, res) {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 30);
  const feed = await postService.listPosts({
    limit,
    cursor: req.query.cursor,
    viewerId: req.user?.uid,
  });
  res.json({ success: true, data: feed.items, pagination: { nextCursor: feed.nextCursor } });
}

export async function questions(req, res) {
  res.json({
    success: true,
    data: await postService.listQuestions({
      questionType: req.query.type,
      viewerId: req.user?.uid,
    }),
  });
}

export async function show(req, res) {
  res.json({
    success: true,
    data: await postService.getPost(req.params.postId, req.user?.uid),
  });
}

export async function mine(req, res) {
  res.json({
    success: true,
    data: await postService.listOwnPosts(req.user.uid),
  });
}

export async function saved(req, res) {
  res.json({
    success: true,
    data: await postService.listSavedPosts(req.user.uid),
  });
}

export async function create(req, res) {
  const post = await postService.createPost(postInput(req.body), req.user);
  res.status(201).json({ success: true, data: post });
}

export async function update(req, res) {
  const updates = Object.fromEntries(
    Object.entries(postInput(req.body, true)).filter(([, value]) => value !== undefined),
  );
  if (!Object.keys(updates).length) throw new ApiError(400, "No post fields were provided.");
  const post = await postService.updatePost(req.params.postId, req.user.uid, updates);
  res.json({ success: true, data: post });
}

export async function remove(req, res) {
  await postService.deletePost(req.params.postId, req.user.uid);
  res.status(204).end();
}

export async function like(req, res) {
  res.json({ success: true, data: await postService.toggleLike(req.params.postId, req.user.uid) });
}

export async function save(req, res) {
  res.json({
    success: true,
    data: await postService.toggleSave(req.params.postId, req.user.uid),
  });
}

export async function comments(req, res) {
  res.json({ success: true, data: await postService.listComments(req.params.postId) });
}

export async function comment(req, res) {
  const item = await postService.addComment(
    req.params.postId,
    text(req.body.content, "content", { max: 1000 }),
    req.user,
  );
  res.status(201).json({ success: true, data: item });
}

export async function removeComment(req, res) {
  await postService.deleteComment(req.params.postId, req.params.commentId, req.user.uid);
  res.status(204).end();
}

export async function replies(req, res) {
  res.json({
    success: true,
    data: await postService.listReplies(
      req.params.postId,
      req.params.commentId,
    ),
  });
}

export async function reply(req, res) {
  const item = await postService.addReply(
    req.params.postId,
    req.params.commentId,
    text(req.body.content, "content", { max: 1000 }),
    req.user,
  );
  res.status(201).json({ success: true, data: item });
}

export async function removeReply(req, res) {
  await postService.deleteReply(
    req.params.postId,
    req.params.commentId,
    req.params.replyId,
    req.user.uid,
  );
  res.status(204).end();
}
