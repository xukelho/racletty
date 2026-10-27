import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { ProjectNotification } from "../api/notifications";
import { NotificationList } from "./NotificationList";

function Location() {
  const location = useLocation();
  return <output>{location.pathname + location.search}</output>;
}

describe("NotificationList", () => {
  it("navigates to the target while marking the notification as read", () => {
    const item: ProjectNotification = {
      id: 1, type: "project.global_message_created", projectId: 42, actorDisplayName: "Marta",
      summary: "adicionou uma mensagem", createdAt: "2026-09-06T09:00:00Z", readAt: null,
      target: { kind: "globalMessage", projectId: 42, documentId: null, conversationId: null, messageId: 7 },
    };
    const onRead = vi.fn();
    render(<MemoryRouter><NotificationList items={[item]} emptyText="Sem notificações" onRead={onRead} /><Location /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /Marta/ }));
    expect(screen.getByRole("status")).toHaveTextContent("/projects/42?tab=global&message=7");
    expect(onRead).toHaveBeenCalledWith(item);
  });
});
