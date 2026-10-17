import ApiError from "../utils/ApiError.js";
import { text } from "../utils/validation.js";
import {
  deleteReportedContent,
  listReports,
  reportPost,
  reportComment,
  updateReportStatus,
} from "../services/report.service.js";

const reportReasons = new Set([
  "spam",
  "harassment",
  "misinformation",
  "graphic_content",
  "copyright",
  "other",
]);
const reportStatuses = new Set(["pending", "resolved", "dismissed"]);

export async function index(req, res) {
  const status = req.query.status || "pending";
  if (
    status !== "all" &&
    !reportStatuses.has(status) &&
    !["post_deleted", "content_deleted"].includes(status)
  ) {
    throw new ApiError(400, "Choose a valid report status.");
  }
  res.json({
    success: true,
    data: await listReports({
      status,
      limit: Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100),
    }),
  });
}

export async function createPostReport(req, res) {
  const { reason, details } = reportInput(req.body);
  const report = await reportPost(
    req.params.postId,
    { reason, details },
    req.user,
  );
  res.status(201).json({ success: true, data: report });
}

function reportInput(body) {
  const reason = text(body.reason, "reason", { max: 40 });
  if (!reportReasons.has(reason)) {
    throw new ApiError(400, "Choose a valid report reason.");
  }
  const details = text(body.details, "details", {
    min: 0,
    max: 1000,
    optional: true,
  });
  if (reason === "other" && !details) {
    throw new ApiError(400, "Add details when choosing Other.");
  }
  return { reason, details };
}

export async function createCommentReport(req, res) {
  const report = await reportComment(
    req.params.postId,
    req.params.commentId,
    req.params.replyId,
    reportInput(req.body),
    req.user,
  );
  res.status(201).json({ success: true, data: report });
}

export async function updateStatus(req, res) {
  const status = text(req.body.status, "status", { max: 20 });
  if (!reportStatuses.has(status)) {
    throw new ApiError(400, "Choose a valid report status.");
  }
  res.json({
    success: true,
    data: await updateReportStatus(req.params.reportId, status, req.user),
  });
}

export async function removeContent(req, res) {
  res.json({
    success: true,
    data: await deleteReportedContent(req.params.reportId, req.user),
  });
}
