import PortalShell from "../components/PortalShell";
import { RoadmapConceptPreview } from "../components/RoadmapConceptPreview";
import "./RoadmapPage.css";

const roadmapItems = [
  {
    concept: "bim",
    title: "Modelos e formatos BIM",
    description: "Partilhe modelos BIM e consulte as plantas diretamente no navegador, para que a equipa e os clientes possam acompanhar cada revisão.",
    details: [
      { label: "Primeiro passo", text: "Suporte a ficheiros IFC (.ifc), um formato aberto para troca de modelos BIM." },
      { label: "Em avaliação", text: "Importação de formatos nativos como Revit (.rvt) e Archicad (.pln), conforme a procura e a viabilidade técnica." },
    ],
  },
  {
    concept: "ai",
    title: "Pré-visualizações 3D com IA",
    description: "Transforme uma planta numa imagem conceptual da casa e explore diferentes ambientes antes de decidir a direção visual.",
    details: [
      { label: "Da planta à imagem", text: "Use a planta do projeto como ponto de partida para gerar uma vista 3D ilustrativa." },
      { label: "Explore estilos", text: "Compare opções como moderno, minimalista e acolhedor para conversar sobre materiais, luz e atmosfera." },
    ],
    note: "As imagens serão ilustrativas e não substituirão um modelo BIM nem uma visualização técnica fiel.",
  },
] as const;

export function RoadmapPage() {
  return <PortalShell>
    <header className="mock-page-header">
      <div>
        <p className="mock-eyebrow">O que vem a seguir</p>
        <h1>Roadmap</h1>
        <p>Estamos a desenvolver novas formas de partilhar projetos e explorar ideias com os clientes.</p>
      </div>
    </header>
    <p className="roadmap-intro">Estas ideias podem mudar à medida que aprendemos com os utilizadores. Ainda não há datas de lançamento definidas.</p>
    <div className="roadmap-list">
      {roadmapItems.map((item) => <article className="roadmap-card" key={item.title}>
        <div className="roadmap-card__copy">
          <h2>{item.title}</h2>
          <p className="roadmap-card__description">{item.description}</p>
          <dl className="roadmap-card__details">
            {item.details.map((detail) => <div key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.text}</dd>
            </div>)}
          </dl>
          {"note" in item && <p className="roadmap-card__note">{item.note}</p>}
        </div>
        <figure className="roadmap-card__concept">
          <RoadmapConceptPreview concept={item.concept} />
          <figcaption>Conceito visual · funcionalidade ainda não disponível e sujeita a alterações</figcaption>
        </figure>
      </article>)}
    </div>
  </PortalShell>;
}
