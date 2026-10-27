import { useEffect, useState } from "react";
import { DesignLabHeader } from "./DesignLabHeader";
import { LabDashboardView, LabLoginView, LabProjectView } from "./LabViews";
import { LabStyle, LabView } from "./designLabModel";
import "./design-lab.css";

export function DesignLabPage() {
  const [style, setStyle] = useState<LabStyle>("atelier");
  const [view, setView] = useState<LabView>("dashboard");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Design Lab | racletty";
    return () => { document.title = previousTitle; };
  }, []);

  return <div className="design-lab" data-lab-style={style}>
    <DesignLabHeader style={style} view={view} onStyleChange={setStyle} onViewChange={setView} />
    {view === "login" && <LabLoginView style={style} onContinue={() => setView("dashboard")} />}
    {view === "dashboard" && <LabDashboardView style={style} onOpenProject={() => setView("project")} />}
    {view === "project" && <LabProjectView style={style} onBack={() => setView("dashboard")} />}
  </div>;
}
