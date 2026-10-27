export type LabProject = {
  title: string;
  code: string;
  client: string;
  address: string;
  phase: string;
  revision: string;
  status: string;
  statusTone: "warm" | "cool" | "calm";
  unread: number;
  illustration: "home" | "urban" | "studio";
};

export const labProjects: LabProject[] = [
  { title: "Casa do Vale", code: "CV-024", client: "Marta e João Silva", address: "Azeitão, Setúbal", phase: "Projeto de execução", revision: "R07", status: "A aguardar cliente", statusTone: "warm", unread: 3, illustration: "home" },
  { title: "Apartamento Alvalade", code: "AA-018", client: "Inês Costa", address: "Alvalade, Lisboa", phase: "Estudo prévio", revision: "R03", status: "Em análise", statusTone: "cool", unread: 1, illustration: "urban" },
  { title: "Atelier da Ribeira", code: "AR-031", client: "Ribeira Criativa, Lda.", address: "Alcântara, Lisboa", phase: "Licenciamento", revision: "R05", status: "Em dia", statusTone: "calm", unread: 0, illustration: "studio" },
];

export const featuredProject = labProjects[0];

export const labMilestones = [
  { label: "Primeiras ideias", date: "12 mar", state: "done" },
  { label: "Estudo prévio", date: "28 abr", state: "done" },
  { label: "Projeto de execução", date: "Hoje", state: "current" },
  { label: "Aprovação", date: "A seguir", state: "next" },
] as const;
