import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Bell, Check, ChevronRight, CircleHelp, FileCheck2, FileText, FolderOpen, Heart, Home, LayoutDashboard, MapPin, MessageCircle, Search, Sparkles } from "lucide-react";
import { LabMascot } from "./LabMascot";
import { LabStyle } from "./designLabModel";
import { featuredProject, labMilestones, labProjects, LabProject } from "./labSampleData";

function LabMark({ style }: { style: LabStyle }) {
  return <span className="lab-brand"><span className="lab-brand__icon"><LabMascot style={style} small /></span><strong>racletty</strong></span>;
}

function LabDrawing({ variant = "home" }: { variant?: LabProject["illustration"] }) {
  return <div className={`lab-drawing lab-drawing--${variant}`} aria-label="Ilustração bidimensional de uma planta arquitetónica" role="img">
    <span className="lab-drawing__grid" />
    <span className="lab-drawing__room lab-drawing__room--one" />
    <span className="lab-drawing__room lab-drawing__room--two" />
    <span className="lab-drawing__room lab-drawing__room--three" />
    <span className="lab-drawing__room lab-drawing__room--four" />
    <span className="lab-drawing__door" />
    <span className="lab-drawing__window" />
    <span className="lab-drawing__note lab-drawing__note--one">01</span>
    <span className="lab-drawing__note lab-drawing__note--two">02</span>
    <span className="lab-drawing__dimension lab-drawing__dimension--top">12,40 m</span>
    <span className="lab-drawing__dimension lab-drawing__dimension--bottom">Planta · piso 0</span>
  </div>;
}

function LabShell({ children, style, current, onDashboard, onProject }: { children: React.ReactNode; style: LabStyle; current: "dashboard" | "project"; onDashboard: () => void; onProject: () => void }) {
  return <div className="lab-shell">
    <aside className="lab-sidebar" aria-label="Navegação da demonstração">
      <LabMark style={style} />
      <div className="lab-sidebar__workspace"><span className="lab-sidebar__workspace-icon"><Home size={17} /></span><span><small>ESPAÇO DE TRABALHO</small><strong>Atelier Forma Norte</strong></span><ChevronRight size={15} aria-hidden="true" /></div>
      <div className="lab-sidebar__caption">GERAL</div>
      <nav aria-label="Navegação do espaço de trabalho">
        <button type="button" className={current === "dashboard" ? "is-active" : ""} aria-current={current === "dashboard" ? "page" : undefined} onClick={onDashboard}><LayoutDashboard size={18} /><span>Visão geral</span></button>
        <button type="button" className={current === "project" ? "is-active" : ""} aria-current={current === "project" ? "page" : undefined} onClick={onProject}><FolderOpen size={18} /><span>Projetos</span><span className="lab-sidebar__count">3</span></button>
        <div className="lab-sidebar__static"><MessageCircle size={18} /><span>Conversas</span><span className="lab-sidebar__count">2</span></div>
        <div className="lab-sidebar__static"><Bell size={18} /><span>Notificações</span></div>
      </nav>
      <div className="lab-sidebar__bottom"><span className="lab-avatar">AM</span><span><strong>Ana Martins</strong><small>Arquiteta</small></span><span className="lab-sidebar__heart"><Heart size={17} /></span></div>
    </aside>
    <main className="lab-main">{children}</main>
  </div>;
}

export function LabLoginView({ style, onContinue }: { style: LabStyle; onContinue: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onContinue(); };
  return <main className="lab-login">
    <section className="lab-login__story">
      <LabMark style={style} />
      <div className="lab-login__story-content">
        <span className="lab-eyebrow"><Sparkles size={15} /> UM ESPAÇO MAIS PRÓXIMO</span>
        <h1>Boas ideias merecem um lugar onde crescer.</h1>
        <p>Revisões, conversas e decisões do teu projeto — tudo junto, claro e com um toque de alegria.</p>
        <div className="lab-login__scene"><div className="lab-login__scene-card"><LabDrawing /><div className="lab-login__scene-footer"><span>Casa do Vale</span><span>Revisão R07 <Check size={14} /></span></div></div><div className="lab-login__mascot"><LabMascot style={style} /></div></div>
      </div>
      <small className="lab-login__footnote">Um lugar para cada ideia. Um caminho claro para cada decisão.</small>
    </section>
    <section className="lab-login__form-wrap">
      <div className="lab-login__form-card">
        <span className="lab-login__hello">Olá, Ana <span aria-hidden="true">✳</span></span>
        <h2>Bem-vinda de volta</h2>
        <p>Entra no teu espaço e continua de onde paraste.</p>
        <form onSubmit={submit}>
          <label htmlFor="lab-email">Email</label>
          <input id="lab-email" type="email" autoComplete="off" placeholder="ana@ateliernorte.pt" value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="lab-password">Palavra-passe</label>
          <input id="lab-password" type="password" autoComplete="off" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="submit" className="lab-primary-button">Entrar no espaço <ArrowRight size={18} /></button>
        </form>
        <div className="lab-login__demo-note"><CircleHelp size={16} /><span>Demonstração visual — não é necessário iniciar sessão.</span></div>
      </div>
    </section>
  </main>;
}

function LabProjectCard({ project, onOpen }: { project: LabProject; onOpen: () => void }) {
  return <article className="lab-project-card">
    <button type="button" className="lab-project-card__visual" onClick={onOpen} aria-label={`Abrir projeto ${project.title}`}><LabDrawing variant={project.illustration} /><span className="lab-project-card__code">{project.code}</span></button>
    <div className="lab-project-card__body"><div className="lab-project-card__top"><span className={`lab-status lab-status--${project.statusTone}`}>{project.status}</span><span className="lab-project-card__revision">{project.revision}</span></div>
      <h3>{project.title}</h3><p>{project.client}</p><div className="lab-project-card__address"><MapPin size={14} />{project.address}</div>
      <div className="lab-project-card__foot"><span>{project.phase}</span><button type="button" onClick={onOpen} aria-label={`Ver detalhes de ${project.title}`}><ArrowRight size={17} /></button></div>
    </div>
  </article>;
}

export function LabDashboardView({ style, onOpenProject }: { style: LabStyle; onOpenProject: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = labProjects.filter((project) => `${project.title} ${project.code} ${project.client} ${project.address}`.toLocaleLowerCase("pt-PT").includes(query.toLocaleLowerCase("pt-PT")));
  return <LabShell style={style} current="dashboard" onDashboard={() => undefined} onProject={onOpenProject}>
    <div className="lab-page-top"><div className="lab-page-top__crumb">Atelier Forma Norte <ChevronRight size={14} /> Visão geral</div><div className="lab-page-top__right"><span className="lab-page-top__date">Quinta-feira, 15 de outubro</span><span className="lab-avatar lab-avatar--small">AM</span></div></div>
    <div className="lab-main__content">
      <section className="lab-welcome"><div><span className="lab-eyebrow"><Sparkles size={15} /> O TEU DIA NO ATELIER</span><h1>Bom dia, Ana <span aria-hidden="true">✳</span></h1><p>Há boas ideias a acontecer. Vamos ver o que precisa de ti?</p><button type="button" className="lab-text-link" onClick={onOpenProject}>Continuar Casa do Vale <ArrowRight size={16} /></button></div><div className="lab-welcome__art"><span className="lab-welcome__sun" /><span className="lab-welcome__scribble" /><LabMascot style={style} /></div></section>
      <section className="lab-section lab-attention" aria-labelledby="lab-attention-title"><div className="lab-section__heading"><div><span className="lab-section__kicker">PARA HOJE</span><h2 id="lab-attention-title">Pede a tua atenção <span className="lab-count">2</span></h2></div><span className="lab-section__subtle">Tudo num só lugar</span></div>
        <div className="lab-attention__grid"><button type="button" className="lab-attention-card" onClick={onOpenProject}><span className="lab-attention-card__icon"><MessageCircle size={20} /></span><span><small>NOVA CONVERSA · CASA DO VALE</small><strong>Marta deixou uma questão sobre a sala.</strong><span>Ver comentário <ArrowRight size={15} /></span></span></button><button type="button" className="lab-attention-card" onClick={onOpenProject}><span className="lab-attention-card__icon"><FileCheck2 size={20} /></span><span><small>REVISÃO PRONTA · CASA DO VALE</small><strong>A revisão R07 está pronta para partilhar.</strong><span>Ver revisão <ArrowRight size={15} /></span></span></button></div>
      </section>
      <section className="lab-section lab-projects" aria-labelledby="lab-projects-title"><div className="lab-section__heading"><div><span className="lab-section__kicker">O QUE ESTÁ A ACONTECER</span><h2 id="lab-projects-title">Os teus projetos <span className="lab-count">3</span></h2></div><label className="lab-search"><Search size={17} /><span className="lab-sr-only">Pesquisar projetos</span><input type="search" placeholder="Pesquisar projetos" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
        {filtered.length > 0 ? <div className="lab-project-grid">{filtered.map((project) => <LabProjectCard key={project.code} project={project} onOpen={onOpenProject} />)}</div> : <div className="lab-empty"><LabMascot style={style} small /><h3>Nenhum projeto encontrado</h3><p>Experimenta outro nome, cliente ou local.</p><button type="button" onClick={() => setQuery("")}>Limpar pesquisa</button></div>}
      </section>
      <div className="lab-dashboard-end"><Heart size={15} /> As boas decisões fazem-se em conjunto.</div>
    </div>
  </LabShell>;
}

export function LabProjectView({ style, onBack }: { style: LabStyle; onBack: () => void }) {
  const [noteOpen, setNoteOpen] = useState(false);
  return <LabShell style={style} current="project" onDashboard={onBack} onProject={() => undefined}>
    <div className="lab-page-top"><div className="lab-page-top__crumb">Atelier Forma Norte <ChevronRight size={14} /> Projetos <ChevronRight size={14} /> Casa do Vale</div><div className="lab-page-top__right"><span className="lab-page-top__date">Quinta-feira, 15 de outubro</span><span className="lab-avatar lab-avatar--small">AM</span></div></div>
    <div className="lab-main__content lab-project-page">
      <button type="button" className="lab-back" onClick={onBack}><ArrowLeft size={16} /> Voltar aos projetos</button>
      <header className="lab-project-hero"><div><span className="lab-eyebrow"><Home size={15} /> PROJETO · {featuredProject.code}</span><h1>{featuredProject.title}</h1><p><MapPin size={16} /> {featuredProject.address} <span>·</span> {featuredProject.client}</p></div><div className="lab-project-hero__side"><span className="lab-status lab-status--warm">{featuredProject.status}</span><strong>{featuredProject.phase}</strong></div></header>
      {style === "storybook" ? <>
      <section className="lab-project-focus" aria-labelledby="lab-project-focus-title"><div className="lab-project-focus__copy"><span className="lab-eyebrow"><Sparkles size={15} /> EM FOCO AGORA</span><h2 id="lab-project-focus-title">A próxima conversa começa com a revisão {featuredProject.revision}.</h2><p>O desenho está pronto. Revê as notas da Marta e prepara uma partilha clara para todos.</p><div className="lab-project-focus__actions"><button type="button" className="lab-primary-button" onClick={() => setNoteOpen((open) => !open)} aria-expanded={noteOpen}>Preparar partilha <ArrowRight size={17} /></button><span>Última atualização · 14 out 2026</span></div>{noteOpen && <div className="lab-next-step__note" role="status"><Check size={18} /> Pré-visualização pronta. Esta experiência não envia nada.</div>}</div><div className="lab-project-focus__mascot"><LabMascot style={style} /><span>Vamos a isso!</span></div></section>
      <div className="lab-project-workspace"><section className="lab-section lab-revision" aria-labelledby="lab-revision-title"><div className="lab-section__heading"><div><span className="lab-section__kicker">REVISÃO ATUAL · {featuredProject.revision}</span><h2 id="lab-revision-title">O desenho em conversa</h2></div><span className="lab-status lab-status--cool">Pronta para rever</span></div><div className="lab-revision__canvas"><LabDrawing /><span className="lab-revision__floating-note"><MessageCircle size={14} /> 2 pontos em discussão</span></div><div className="lab-revision__foot"><span><FileText size={17} /> Planta do piso térreo · PDF</span><span>Atualizado ontem</span></div></section>
      <aside className="lab-project-discussion" aria-label="Conversa e próximos passos"><div className="lab-project-discussion__heading"><span className="lab-section__kicker">A CONVERSA CONTINUA</span><span className="lab-project-discussion__bubble"><MessageCircle size={18} /></span></div><h2>O que precisa de resposta</h2><article className="lab-comment"><div className="lab-comment__author"><span className="lab-comment__avatar">M</span><span><strong>Marta Silva</strong><small>Ontem · revisão R07</small></span></div><p>“Podemos abrir um pouco mais a sala para o jardim?”</p><span className="lab-comment__status">Por responder</span></article><div className="lab-project-discussion__next"><small>DEPOIS DE RESPONDER</small><strong>Partilhar a revisão com Marta e João</strong><span>Todos avançam com a mesma versão.</span></div><button type="button" className="lab-project-discussion__action" onClick={() => setNoteOpen((open) => !open)}>{noteOpen ? "Pré-visualização pronta" : "Preparar resposta"} <ArrowRight size={17} /></button></aside></div>
      </> : <>
      <div className="lab-project-summary"><div><small>FASE ATUAL</small><strong>{featuredProject.phase}</strong></div><div><small>ÚLTIMA REVISÃO</small><strong>{featuredProject.revision} · 14 out 2026</strong></div><div><small>PRÓXIMO PASSO</small><strong>Partilhar com Marta e João</strong></div></div>
      <div className="lab-project-lower"><section className="lab-section lab-revision" aria-labelledby="lab-revision-title"><div className="lab-section__heading"><div><span className="lab-section__kicker">A REVISÃO MAIS RECENTE</span><h2 id="lab-revision-title">Revisão {featuredProject.revision}</h2></div><span className="lab-status lab-status--cool">Pronta para rever</span></div><LabDrawing /><div className="lab-revision__foot"><span><FileText size={17} /> Planta do piso térreo · PDF</span><span>Atualizado ontem</span></div></section><aside className="lab-next-step"><div className="lab-next-step__mascot"><LabMascot style={style} /></div><span className="lab-section__kicker">O PRÓXIMO PASSO</span><h2>Uma boa ideia pede conversa.</h2><p>A revisão está pronta. Partilha o desenho e convida Marta e João a decidir contigo.</p><button type="button" className="lab-primary-button" onClick={() => setNoteOpen((open) => !open)} aria-expanded={noteOpen}>Preparar partilha <ArrowRight size={17} /></button>{noteOpen && <div className="lab-next-step__note" role="status"><Check size={18} /> Pré-visualização pronta. Esta experiência não envia nada.</div>}</aside></div>
      </>}
      <section className="lab-section lab-journey" aria-labelledby="lab-journey-title"><div className="lab-section__heading"><div><span className="lab-section__kicker">O PERCURSO</span><h2 id="lab-journey-title">Um passo de cada vez</h2></div><span className="lab-section__subtle">Cada etapa conta uma história</span></div><ol className="lab-timeline">{labMilestones.map((milestone) => <li key={milestone.label} className={`lab-timeline__item lab-timeline__item--${milestone.state}`}><span className="lab-timeline__marker">{milestone.state === "done" ? <Check size={15} /> : milestone.state === "current" ? <Sparkles size={15} /> : null}</span><strong>{milestone.label}</strong><small>{milestone.date}</small></li>)}</ol></section>
      <div className="lab-dashboard-end"><Heart size={15} /> As boas decisões fazem-se em conjunto.</div>
    </div>
  </LabShell>;
}
