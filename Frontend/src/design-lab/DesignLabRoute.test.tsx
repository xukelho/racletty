import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "../App";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("design lab route", () => {
  it("opens with synthetic content without calling an API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter initialEntries={["/design-lab"]}><App /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: /Bom dia, Ana/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Estilos do design lab" }).querySelectorAll("button")).toHaveLength(4);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
