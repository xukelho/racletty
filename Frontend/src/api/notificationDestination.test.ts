import { describe, expect, it } from "vitest";
import { notificationDestination } from "./notificationDestination";
import type { NotificationTarget } from "./notifications";

const target = (changes: Partial<NotificationTarget>): NotificationTarget => ({
  kind: "project", projectId: 42, documentId: null, conversationId: null, messageId: null, ...changes,
});

describe("notificationDestination", () => {
  it("routes files and chats using their stable IDs", () => {
    expect(notificationDestination(target({ kind: "document", documentId: "file-1" }))).toBe("/projects/42?document=file-1");
    expect(notificationDestination(target({ kind: "globalMessage", messageId: 7 }))).toBe("/projects/42?tab=global&message=7");
    expect(notificationDestination(target({ kind: "partConversation", conversationId: 9, messageId: 10 }))).toBe("/projects/42?conversation=9&message=10");
    expect(notificationDestination(target({ kind: "partConversation", conversationId: 9 }))).toBe("/projects/42?conversation=9");
  });

  it("falls back to the project and handles company storage", () => {
    expect(notificationDestination(target({ kind: "timeline" }))).toBe("/projects/42");
    expect(notificationDestination(target({ projectId: null }))).toBeNull();
    expect(notificationDestination(target({ kind: "companyStorage", projectId: null }))).toBe("/settings/storage");
  });
});
