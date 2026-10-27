import { ArrowRight, FileBox, Sparkles } from "lucide-react";

type Concept = "bim" | "ai";

function PlanDrawing() {
  return <div className="roadmap-shot__plan">
    <span className="roadmap-shot__room roadmap-shot__room--one" />
    <span className="roadmap-shot__room roadmap-shot__room--two" />
    <span className="roadmap-shot__room roadmap-shot__room--three" />
    <span className="roadmap-shot__room roadmap-shot__room--four" />
  </div>;
}

function HouseDrawing() {
  return <svg className="roadmap-shot__house" viewBox="0 0 300 150" aria-hidden="true">
    <defs>
      <linearGradient id="roadmap-sky" x2="0" y2="1">
        <stop stopColor="#dceff0" />
        <stop offset="1" stopColor="#f5f3e9" />
      </linearGradient>
    </defs>
    <rect width="300" height="150" fill="url(#roadmap-sky)" />
    <path d="M0 111 Q90 101 170 109 T300 104 V150 H0Z" fill="#d9e5d6" />
    <path d="M60 62 178 43 244 66 130 87Z" fill="#67777a" />
    <path d="M69 67 130 87 130 132 69 113Z" fill="#d6c4ae" />
    <path d="M130 87 244 66 244 111 130 132Z" fill="#f3ede1" />
    <path d="M145 91 190 82 190 117 145 125Z" fill="#759fa5" />
    <path d="M197 81 228 75 228 112 197 118Z" fill="#87abb0" />
    <path d="M82 80 111 89 111 111 82 102Z" fill="#88acaf" />
    <path d="M145 108 190 99 M197 99 228 93" stroke="#e8f2ed" strokeWidth="2" />
    <path d="M130 132 244 111 268 125 151 148Z" fill="#c1b8a4" />
    <path d="M44 114 Q37 102 45 95 Q44 86 55 83 Q65 86 63 96 Q74 104 62 115Z" fill="#72978c" />
    <path d="M53 112 V134" stroke="#7b7362" strokeWidth="3" />
  </svg>;
}

export function RoadmapConceptPreview({ concept }: { concept: Concept }) {
  if (concept === "bim") return <div className="roadmap-shot" aria-hidden="true">
    <div className="roadmap-shot__top"><span className="roadmap-shot__dot" /><strong>Casa do Vale</strong><span>Revisão R03</span></div>
    <div className="roadmap-shot__viewer">
      <div className="roadmap-shot__rail"><strong>Plantas</strong><span className="is-selected">Piso 0</span><span>Piso 1</span><span>Cobertura</span></div>
      <div className="roadmap-shot__canvas"><span className="roadmap-shot__file-tag">IFC</span><PlanDrawing /></div>
    </div>
    <div className="roadmap-shot__foot"><span>Planta geral</span><span>3 comentários</span></div>
    <div className="roadmap-shot__formats">
      <span><FileBox size={14} /> IFC <small>primeiro passo</small></span>
      <span><FileBox size={14} /> RVT <small>em avaliação</small></span>
      <span><FileBox size={14} /> PLN <small>em avaliação</small></span>
    </div>
  </div>;

  return <div className="roadmap-shot" aria-hidden="true">
    <div className="roadmap-shot__top"><span className="roadmap-shot__dot" /><strong>Da planta à ideia</strong><Sparkles size={14} /></div>
    <div className="roadmap-shot__comparison">
      <div className="roadmap-shot__source"><span>Planta de origem</span><PlanDrawing /></div>
      <ArrowRight className="roadmap-shot__arrow" size={16} strokeWidth={1.8} />
      <div className="roadmap-shot__render"><HouseDrawing /><span>Imagem conceptual</span></div>
    </div>
    <div className="roadmap-shot__styles"><span className="is-selected">Moderno</span><span>Minimalista</span><span>Acolhedor</span></div>
  </div>;
}
