import { useLocation } from "react-router-dom";

const workshopFrontend = import.meta.env.VITE_WORKSHOP_UI === "true";

export function FrontendSwitcher() {
  const location = useLocation();
  const route = `${location.pathname}${location.search}${location.hash}`;
  const destination = workshopFrontend ? `/legacy${route}` : route;

  return (
    <a className="frontend-switcher" href={destination} aria-label={workshopFrontend ? "Abrir interface anterior" : "Abrir nova interface"}>
      <span aria-hidden="true">✦</span>
      {workshopFrontend ? "Interface anterior" : "Nova interface"}
    </a>
  );
}
