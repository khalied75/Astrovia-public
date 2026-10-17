import { deleteMessage } from "../services/message.service.js";

export async function remove(req, res) {
  await deleteMessage(
    req.params.conversationId,
    req.params.messageId,
    req.user.uid,
  );
  res.status(204).end();
}
