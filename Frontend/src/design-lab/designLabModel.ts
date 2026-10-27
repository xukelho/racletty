export const labStyles = [
  { id: "atelier", label: "Cozy Atelier", shortLabel: "Atelier", number: "01" },
  { id: "blueprint", label: "Playful Blueprint", shortLabel: "Blueprint", number: "02" },
  { id: "studio", label: "Soft Studio", shortLabel: "Studio", number: "03" },
  { id: "storybook", label: "Warm Workshop", shortLabel: "Workshop", number: "04" },
] as const;

export type LabStyle = (typeof labStyles)[number]["id"];
export type LabView = "login" | "dashboard" | "project";

export const labViews: { id: LabView; label: string }[] = [
  { id: "login", label: "Boas-vindas" },
  { id: "dashboard", label: "Dashboard" },
  { id: "project", label: "Projeto" },
];
