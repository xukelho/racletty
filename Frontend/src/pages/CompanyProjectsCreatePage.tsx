import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PortalShell from "../components/PortalShell";
import { GoogleMapPicker } from "../components/GoogleMapPicker";
import { ProjectTimelineEditor, TimelinePhase, newTimelinePhase } from "../components/ProjectTimelineEditor";
import { ClientManagementApiError, createProject, getClients, getCompanyMembers, ProjectMember } from "../api/projects";
import { useProfile } from "../profile/ProfileContext";
import { QUICK_FILL_PHASE_CODES } from "../projectPhases";

const blank = { title: "", code: "", address: "", googleMapsUrl: "" };
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("pt-PT");

export function CompanyProjectsCreatePage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const owner = profile?.companyRole === "owner";
  const [data, setData] = useState(blank);
  const [clients, setClients] = useState<Array<{ id: number; displayName: string }>>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [timelinePhases, setTimelinePhases] = useState<TimelinePhase[]>([]);
  const [currentPhaseId, setCurrentPhaseId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const errorSummary = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!owner) return;
    Promise.all([getClients(), getCompanyMembers()])
      .then(([loadedClients, loadedMembers]) => { setClients(loadedClients); setMembers(loadedMembers); })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Erro ao carregar."));
  }, [owner]);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-PT");
    return members.filter((member) => member.displayName.toLocaleLowerCase("pt-PT").includes(normalizedQuery));
  }, [members, query]);
  const toggleMember = (employeeId: number, checked: boolean) => setSelected((current) => checked ? [...current, employeeId] : current.filter((id) => id !== employeeId));
  const toggleClient = (clientId: number, checked: boolean) => setSelectedClients((current) => checked ? [...current, clientId] : current.filter((id) => id !== clientId));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    const nextErrors: Record<string, string> = {};
    if (!data.title.trim()) nextErrors.title = "Indica o título do projeto.";
    if (!data.code.trim()) nextErrors.code = "Indica o código do projeto.";
    if (data.googleMapsUrl.trim()) {
      try { new URL(data.googleMapsUrl); } catch { nextErrors.googleMapsUrl = "Indica um URL válido."; }
    }
    setFieldErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length) {
      window.requestAnimationFrame(() => document.getElementById(`create-project-${Object.keys(nextErrors)[0]}`)?.focus());
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const result = await createProject({ ...data, clientIds: selectedClients, employeeIds: selected, phaseCodes: timelinePhases.map((phase) => phase.code), currentPhaseIndex: currentPhaseId ? timelinePhases.findIndex((phase) => phase.id === currentPhaseId) : null });
      navigate(`/projects/${result.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao guardar.");
      if (caught instanceof ClientManagementApiError) {
        const serverErrors = Object.fromEntries(Object.entries(caught.fieldErrors).filter(([key]) => ["title", "code", "address", "googleMapsUrl"].includes(key)));
        setFieldErrors(serverErrors);
        window.requestAnimationFrame(() => {
          const firstField = Object.keys(serverErrors)[0];
          if (firstField) document.getElementById(`create-project-${firstField}`)?.focus();
          else errorSummary.current?.focus();
        });
      } else window.requestAnimationFrame(() => errorSummary.current?.focus());
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof typeof blank, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  return <PortalShell>
    <button className="mock-back-link" onClick={() => navigate("/projects")}><ArrowLeft size={17} />Projetos</button>
    <header className="mock-page-header"><div><h1>Criar projeto</h1><p>Informação essencial, participantes e timeline do projeto.</p></div></header>
    {error && <p className="mock-project-notice mock-project-notice--error" role="alert" tabIndex={-1} ref={errorSummary}>{error}</p>}
    {owner && <form className="mock-form-column" onSubmit={submit} noValidate aria-busy={isSubmitting}>
      <section className="mock-surface"><div className="mock-form-grid">
        <label className="mock-field mock-field--wide">Título<input id="create-project-title" aria-label="Título" required value={data.title} aria-invalid={!!fieldErrors.title} aria-describedby={fieldErrors.title ? "create-project-title-error" : undefined} onChange={(event) => updateField("title", event.target.value)} />{fieldErrors.title && <small className="mock-field-error" id="create-project-title-error">{fieldErrors.title}</small>}</label>
        <label className="mock-field">Código<input id="create-project-code" aria-label="Código" required value={data.code} aria-invalid={!!fieldErrors.code} aria-describedby={fieldErrors.code ? "create-project-code-error" : undefined} onChange={(event) => updateField("code", event.target.value)} />{fieldErrors.code && <small className="mock-field-error" id="create-project-code-error">{fieldErrors.code}</small>}</label>
        <label className="mock-field mock-field--wide">Morada<input id="create-project-address" aria-label="Morada" value={data.address} aria-invalid={!!fieldErrors.address} aria-describedby={fieldErrors.address ? "create-project-address-error" : undefined} onChange={(event) => updateField("address", event.target.value)} />{fieldErrors.address && <small className="mock-field-error" id="create-project-address-error">{fieldErrors.address}</small>}</label>
        <label className="mock-field mock-field--wide">Localização (Google Maps)<input id="create-project-googleMapsUrl" aria-label="Localização (Google Maps)" type="url" value={data.googleMapsUrl} placeholder="Cole um link do Google Maps" aria-invalid={!!fieldErrors.googleMapsUrl} aria-describedby={fieldErrors.googleMapsUrl ? "create-project-googleMapsUrl-error" : undefined} onChange={(event) => updateField("googleMapsUrl", event.target.value)} /><small>Opcional. Pode colar um link ou selecionar no mapa.</small>{fieldErrors.googleMapsUrl && <small className="mock-field-error" id="create-project-googleMapsUrl-error">{fieldErrors.googleMapsUrl}</small>}</label>
        <div className="mock-field--wide"><GoogleMapPicker onLocationChange={(googleMapsUrl) => updateField("googleMapsUrl", googleMapsUrl)} /></div>
      </div></section>
      <section className="mock-surface">
        <div className="mock-section-title"><div><h2>Clientes associados</h2><p>Seleciona os clientes que terão acesso a este projeto.</p></div></div>
        <div className="mock-project-member-grid">{clients.map((client) => <label className="mock-project-member-card" key={client.id}><input type="checkbox" checked={selectedClients.includes(client.id)} onChange={(event) => toggleClient(client.id, event.target.checked)} /><span className="mock-client-avatar mock-client-avatar--blue" aria-hidden="true">{initials(client.displayName)}</span><span><strong>{client.displayName}</strong></span></label>)}</div>
        {!clients.length && <p className="mock-empty-state">Não existem clientes a apresentar.</p>}
      </section>
      <section className="mock-surface project-timeline-section"><div className="mock-section-title"><div><h2>Timeline do projeto</h2><p>Opcional. Define a sequência de fases e, se aplicável, a fase atual.</p></div></div><ProjectTimelineEditor phases={timelinePhases} currentPhaseId={currentPhaseId} onPhasesChange={setTimelinePhases} onCurrentPhaseIdChange={setCurrentPhaseId} onQuickFill={() => { setTimelinePhases(QUICK_FILL_PHASE_CODES.map(newTimelinePhase)); setCurrentPhaseId(null); }} /></section>
      <section className="mock-surface">
        <div className="mock-section-title"><div><h2>Arquitetos atribuídos</h2><p>Seleciona os arquitetos que podem colaborar neste projeto.</p></div></div>
        <div className="mock-toolbar mock-project-members-toolbar"><label className="mock-search"><Search size={19} /><span className="sr-only">Pesquisar colaboradores</span><input type="search" placeholder="Pesquisar por colaborador" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="Limpar pesquisa" onClick={() => setQuery("")}><X size={16} /></button>}</label><span className="mock-result-count">{filteredMembers.length} {filteredMembers.length === 1 ? "arquiteto" : "arquitetos"}</span></div>
        <div className="mock-project-member-grid">{filteredMembers.map((member) => <label className="mock-project-member-card" key={member.employeeId}><input type="checkbox" checked={selected.includes(member.employeeId)} onChange={(event) => toggleMember(member.employeeId, event.target.checked)} /><span className="mock-client-avatar mock-client-avatar--blue" aria-hidden="true">{initials(member.displayName)}</span><span><strong>{member.displayName}</strong></span></label>)}</div>
        {!filteredMembers.length && <p className="mock-empty-state">Não existem arquitetos a apresentar.</p>}
      </section>
      <button className="primary-action" type="submit" disabled={isSubmitting}>{isSubmitting ? "A criar projeto…" : "Criar projeto"}</button>
    </form>}
  </PortalShell>;
}
