import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { setAuthenticatedRoles } from "../auth";
import { ProfileProvider } from "../profile/ProfileContext";
import { CompanyProjectsCreatePage } from "./CompanyProjectsCreatePage";

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const profile = { profileType: "employee", userId: 1, username: "ana", displayName: "Ana Martins", fullName: "Ana Martins", nif: "123", email: "ana@example.test", phoneNumber: "910", address: "Lisboa", companyId: 1, companyName: "Forma Norte", roles: ["employee"], availableCompanies: [], companyRole: "owner", isArchitect: true, themePreference: "light" };

function renderPage() {
  setAuthenticatedRoles(["employee"]);
  return render(<MemoryRouter><ProfileProvider><CompanyProjectsCreatePage /></ProfileProvider></MemoryRouter>);
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); sessionStorage.clear(); });

describe("CompanyProjectsCreatePage", () => {
  it("identifies missing fields and focuses the first one", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => String(input) === "/api/profile" ? response(profile) : response([]));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Criar projeto" }));
    expect(await screen.findByText("Indica o título do projeto.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Título/)).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/projects/", expect.anything());
  });

  it("keeps entered data and focuses a server-rejected field after one submission", async () => {
    let finish!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => { finish = resolve; });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = String(input);
      if (path === "/api/profile") return response(profile);
      if (path === "/api/clients/" || path === "/api/projects/members") return response([]);
      if (path === "/api/projects/" && init?.method === "POST") return pending;
      throw new Error(`Unexpected request: ${path}`);
    });
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText("Título"), "Casa Nova");
    await user.type(screen.getByLabelText("Código"), "CV-001");
    await user.click(screen.getByRole("button", { name: "Criar projeto" }));
    expect(screen.getByRole("button", { name: "A criar projeto…" })).toBeDisabled();
    expect(fetchMock.mock.calls.filter(([input, init]) => String(input) === "/api/projects/" && init?.method === "POST")).toHaveLength(1);

    finish(response({ error: "O código já está em uso.", errors: { Code: ["Este código já está em uso."] } }, 409));
    expect(await screen.findByText("Este código já está em uso.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/^Código/)).toHaveFocus());
    expect(screen.getByLabelText(/^Título/)).toHaveValue("Casa Nova");
    expect(screen.getByLabelText(/^Código/)).toHaveValue("CV-001");
  });
});
