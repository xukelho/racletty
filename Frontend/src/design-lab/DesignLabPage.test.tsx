import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DesignLabPage } from "./DesignLabPage";

afterEach(cleanup);

describe("design lab", () => {
  it("shows four persistent style controls and switches the current screen in place", () => {
    document.documentElement.dataset.theme = "dark";
    const { container } = render(<DesignLabPage />);
    const lab = container.querySelector(".design-lab");
    const labels = ["Cozy Atelier", "Playful Blueprint", "Soft Studio", "Warm Workshop"];

    expect(screen.getByRole("group", { name: "Estilos do design lab" }).querySelectorAll("button")).toHaveLength(4);
    expect(lab).toHaveAttribute("data-lab-style", "atelier");
    expect(screen.getByRole("heading", { name: /Bom dia, Ana/ })).toBeInTheDocument();

    for (const [index, label] of labels.entries()) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(lab).toHaveAttribute("data-lab-style", ["atelier", "blueprint", "studio", "storybook"][index]);
      expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("heading", { name: /Bom dia, Ana/ })).toBeInTheDocument();
    }
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("keeps the chosen style while moving through the three demonstration screens", () => {
    const { container } = render(<DesignLabPage />);
    fireEvent.click(screen.getByRole("button", { name: "Soft Studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Boas-vindas" }));
    expect(screen.getByRole("heading", { name: "Bem-vinda de volta" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Entrar no espaço" }));
    expect(screen.getByRole("heading", { name: /Bom dia, Ana/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Projeto$/ }));
    expect(screen.getByRole("heading", { name: "Casa do Vale" })).toBeInTheDocument();
    expect(container.querySelector(".design-lab")).toHaveAttribute("data-lab-style", "studio");
    expect(screen.getByRole("group", { name: "Estilos do design lab" }).querySelectorAll("button")).toHaveLength(4);
  });

  it("filters the synthetic projects and shows an empty state", () => {
    render(<DesignLabPage />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Pesquisar projetos" }), { target: { value: "não existe" } });
    expect(screen.getByRole("heading", { name: "Nenhum projeto encontrado" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpar pesquisa" }));
    expect(screen.getByRole("heading", { name: "Casa do Vale" })).toBeInTheDocument();
  });

  it("keeps the original project comparison and gives Workshop the new discussion layout", () => {
    render(<DesignLabPage />);
    fireEvent.click(screen.getByRole("button", { name: /^Projeto$/ }));
    expect(screen.getByRole("heading", { name: "Revisão R07" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "O que precisa de resposta" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Warm Workshop" }));
    expect(screen.getByRole("heading", { name: "O desenho em conversa" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "O que precisa de resposta" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Estilos do design lab" }).querySelectorAll("button")).toHaveLength(4);
  });
});
