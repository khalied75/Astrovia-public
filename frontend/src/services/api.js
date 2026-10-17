const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function fetchApi(url, options) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (attempt === 2) {
        throw new Error(
          "The Astrovia API is offline. Start the project with npm run dev from the root folder.",
          { cause: error },
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
}

async function request(
  path,
  {
    token,
    adminSession,
    body,
    formData,
    includeMeta = false,
    ...options
  } = {},
) {
  const response = await fetchApi(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(body && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(adminSession && { "X-Admin-Session": adminSession }),
      ...options.headers,
    },
    ...(body && { body: JSON.stringify(body) }),
    ...(formData && { body: formData }),
  });

  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "The Astrovia API returned an invalid response. Check the frontend API URL.",
    );
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || "The server could not complete the request.",
    );
    error.status = response.status;
    throw error;
  }
  if (!payload || typeof payload !== "object") {
    throw new Error("The Astrovia API returned an empty response.");
  }
  return includeMeta ? payload : payload.data;
}

export const api = {
  getAdminSecurityStatus: (token) =>
    request("/admin-access/status", { token }),
  setupAdminPassword: (token, password) =>
    request("/admin-access/setup", {
      method: "POST",
      token,
      body: { password },
    }),
  unlockAdmin: (token, password) =>
    request("/admin-access/unlock", {
      method: "POST",
      token,
      body: { password },
    }),
  verifyAdminSession: (token, adminSession) =>
    request("/admin-access/session", { token, adminSession }),
  lockAdmin: (token, adminSession) =>
    request("/admin-access/session", {
      method: "DELETE",
      token,
      adminSession,
    }),
  syncCurrentUser: (token) => request("/auth/me", { token }),
  updateProfile: (token, profile) =>
    request("/users/me/profile", { method: "PATCH", token, body: profile }),
  getProfile: (userId, token) =>
    request(`/users/${encodeURIComponent(userId)}`, { token }),
  toggleFollow: (token, userId) =>
    request(`/users/${encodeURIComponent(userId)}/follow`, {
      method: "POST",
      token,
    }),
  getFollowers: (userId) =>
    request(`/users/${encodeURIComponent(userId)}/followers`),
  getFollowing: (userId) =>
    request(`/users/${encodeURIComponent(userId)}/following`),
  getUserPosts: (userId, token) =>
    request(`/users/${encodeURIComponent(userId)}/posts`, { token }),
  getPosts: (token, cursor) => {
    const query = new URLSearchParams({ limit: "15" });
    if (cursor) query.set("cursor", cursor);
    return request(`/posts?${query}`, { token, includeMeta: true });
  },
  getPost: (postId, token) =>
    request(`/posts/${encodeURIComponent(postId)}`, { token }),
  getQuestions: (token, type) => {
    const query = new URLSearchParams();
    if (type) query.set("type", type);
    const suffix = query.size ? `?${query}` : "";
    return request(`/posts/questions${suffix}`, { token });
  },
  uploadPostImage: (token, image) => {
    const formData = new FormData();
    formData.append("image", image);
    return request("/uploads/images", { method: "POST", token, formData });
  },
  uploadProfileImage: (token, image) => {
    const formData = new FormData();
    formData.append("image", image);
    return request("/uploads/profile-image", {
      method: "POST",
      token,
      formData,
    });
  },
  uploadMessageImage: (token, image) => {
    const formData = new FormData();
    formData.append("image", image);
    return request("/uploads/message-image", {
      method: "POST",
      token,
      formData,
    });
  },
  createPost: (token, post) =>
    request("/posts", { method: "POST", token, body: post }),
  togglePostLike: (token, postId) =>
    request(`/posts/${encodeURIComponent(postId)}/like`, {
      method: "POST",
      token,
    }),
  togglePostSave: (token, postId) =>
    request(`/posts/${encodeURIComponent(postId)}/save`, {
      method: "POST",
      token,
    }),
  deletePost: (token, postId) =>
    request(`/posts/${encodeURIComponent(postId)}`, {
      method: "DELETE",
      token,
    }),
  reportPost: (token, postId, report) =>
    request(`/reports/posts/${encodeURIComponent(postId)}`, {
      method: "POST",
      token,
      body: report,
    }),
  reportComment: (token, postId, commentId, report) =>
    request(
      `/reports/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
      { method: "POST", token, body: report },
    ),
  reportReply: (token, postId, commentId, replyId, report) =>
    request(
      `/reports/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/replies/${encodeURIComponent(replyId)}`,
      { method: "POST", token, body: report },
    ),
  getReports: (token, status = "pending", adminSession) =>
    request(`/reports?status=${encodeURIComponent(status)}`, {
      token,
      adminSession,
    }),
  updateReportStatus: (token, reportId, status, adminSession) =>
    request(`/reports/${encodeURIComponent(reportId)}`, {
      method: "PATCH",
      token,
      adminSession,
      body: { status },
    }),
  deleteReportedContent: (token, reportId, adminSession) =>
    request(`/reports/${encodeURIComponent(reportId)}/content`, {
      method: "DELETE",
      token,
      adminSession,
    }),
  deleteMessage: (token, conversationId, messageId) =>
    request(
      `/messages/${encodeURIComponent(conversationId)}/${encodeURIComponent(messageId)}`,
      { method: "DELETE", token },
    ),
  getMyPosts: (token) => request("/posts/mine", { token }),
  getSavedPosts: (token) => request("/posts/saved", { token }),
  getComments: (postId) =>
    request(`/posts/${encodeURIComponent(postId)}/comments`),
  addComment: (token, postId, content) =>
    request(`/posts/${encodeURIComponent(postId)}/comments`, {
      method: "POST",
      token,
      body: { content },
    }),
  deleteComment: (token, postId, commentId) =>
    request(
      `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
      { method: "DELETE", token },
    ),
  getReplies: (postId, commentId) =>
    request(
      `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/replies`,
    ),
  addReply: (token, postId, commentId, content) =>
    request(
      `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/replies`,
      { method: "POST", token, body: { content } },
    ),
  deleteReply: (token, postId, commentId, replyId) =>
    request(
      `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/replies/${encodeURIComponent(replyId)}`,
      { method: "DELETE", token },
    ),
};
