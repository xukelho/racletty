import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import App from "./App";
import { LabMascot } from "./design-lab/LabMascot";
import "./styles.css";
import { getAuthenticatedRoles } from "./auth";
import { applyThemePreference, readCachedThemePreference } from "./theme";

const workshopStyles = Promise.all([import("../../Frontend 2/src/workshop.css"), import("../../Frontend 2/src/project.css")]);

const roles = getAuthenticatedRoles();
const hasProfileRole = roles.includes("client") || roles.includes("employee");
applyThemePreference(hasProfileRole ? readCachedThemePreference() : "light");

function FrontendApp() {
  const { pathname } = useLocation();
  return <>
    <App />
    {pathname === "/dashboard" && <div className="workshop-mascot workshop-mascot--dashboard"><LabMascot style="storybook" /></div>}
  </>;
}

void workshopStyles.then(() => createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <FrontendApp />
    </BrowserRouter>
  </StrictMode>,
));
