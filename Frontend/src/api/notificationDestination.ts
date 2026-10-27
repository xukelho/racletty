import type { NotificationTarget } from "./notifications";

export function notificationDestination(target: NotificationTarget): string | null {
  if (target.kind === "companyStorage") return "/settings/storage";
  if (target.projectId == null) return null;
  const path = `/projects/${target.projectId}`;
  const query = new URLSearchParams();
  if (target.kind === "document" && target.documentId) query.set("document", target.documentId);
  if (target.kind === "globalMessage") {
    query.set("tab", "global");
    if (target.messageId != null) query.set("message", String(target.messageId));
  }
  if (target.kind === "partConversation" && target.conversationId != null) {
    query.set("conversation", String(target.conversationId));
    if (target.messageId != null) query.set("message", String(target.messageId));
  }
  return query.size ? `${path}?${query}` : path;
}
