import { ArrowUpRight, FlaskConical } from "lucide-react";
import { labStyles, labViews, LabStyle, LabView } from "./designLabModel";

type Props = {
  style: LabStyle;
  view: LabView;
  onStyleChange: (style: LabStyle) => void;
  onViewChange: (view: LabView) => void;
};

export function DesignLabHeader({ style, view, onStyleChange, onViewChange }: Props) {
  return <header className="lab-topbar">
    <div className="lab-topbar__intro"><FlaskConical size={16} aria-hidden="true" /><span>Racletty <strong>Design Lab</strong></span><span className="lab-topbar__tag">Experiência</span></div>
    <div className="lab-topbar__controls">
      <div className="lab-style-switcher" role="group" aria-label="Estilos do design lab">
        {labStyles.map((option) => <button
          key={option.id}
          type="button"
          className="lab-style-button"
          aria-label={option.label}
          aria-pressed={style === option.id}
          title={option.label}
          onClick={() => onStyleChange(option.id)}
        ><span className={`lab-style-swatch lab-style-swatch--${option.id}`} aria-hidden="true" /><span>{option.shortLabel}</span></button>)}
      </div>
      <nav className="lab-view-switcher" aria-label="Ecrãs de demonstração">
        {labViews.map((option) => <button key={option.id} type="button" aria-current={view === option.id ? "page" : undefined} onClick={() => onViewChange(option.id)}>{option.label}</button>)}
      </nav>
    </div>
    <span className="lab-topbar__note">Explora livremente <ArrowUpRight size={14} aria-hidden="true" /></span>
  </header>;
}
