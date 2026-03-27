import { useState, useMemo } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { AiSuggestion } from '../../components/AiSuggestion';
import { EmptyState, ActionButton, PageHeader } from '../../components/ui';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const TODAY = () => new Date().toISOString().slice(0, 10);

/** Days since a date string (YYYY-MM-DD) */
export function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Whether a contact is overdue for follow-up */
export function isOverdue(contact) {
  if (!contact.followUpDays) return false;
  return daysSince(contact.lastTouched) >= contact.followUpDays;
}

function AddContactModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', company: '', role: '', email: '', linkedin: '',
    whereMet: '', tags: '', followUpDays: '',
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const tagsArr = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    onSave({
      name: form.name.trim(),
      company: form.company.trim(),
      role: form.role.trim(),
      email: form.email.trim(),
      linkedin: form.linkedin.trim(),
      whereMet: form.whereMet.trim(),
      tags: tagsArr,
      followUpDays: parseInt(form.followUpDays) || 0,
      lastTouched: TODAY(),
      interactions: [],
    });
  }

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div data-testid="add-contact-modal">
        <h2 className="text-lg font-bold text-foreground mb-4">Add Contact</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { field: 'name', label: 'Name *', placeholder: 'Jane Smith', testId: 'contact-name-input' },
            { field: 'company', label: 'Company', placeholder: 'Acme Corp' },
            { field: 'role', label: 'Role', placeholder: 'Engineering Manager' },
            { field: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email' },
            { field: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...' },
            { field: 'whereMet', label: 'Where you met', placeholder: 'Tech conference 2025' },
            { field: 'tags', label: 'Tags (comma-separated)', placeholder: 'recruiter, mentor' },
          ].map(({ field, label, placeholder, type, testId }) => (
            <div key={field}>
              <label className="block text-muted-foreground text-sm mb-1">{label}</label>
              <input
                type={type || 'text'}
                value={form[field]}
                onChange={set(field)}
                placeholder={placeholder}
                className="w-full bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                data-testid={testId}
              />
            </div>
          ))}
          <div>
            <label className="block text-muted-foreground text-sm mb-1">Follow-up reminder (days, 0 = none)</label>
            <input
              type="number"
              value={form.followUpDays}
              onChange={set('followUpDays')}
              placeholder="14"
              min="0"
              className="w-full bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              data-testid="contact-followup-input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-foreground hover:bg-foreground/90 text-background font-semibold py-2 text-sm transition-colors">
              Add Contact
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-secondary text-foreground font-semibold py-2 text-sm hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function LogInteractionModal({ contact, onSave, onClose }) {
  const [note, setNote] = useState('');
  const [date, setDate] = useState(TODAY());

  function handleSubmit(e) {
    e.preventDefault();
    if (!note.trim()) return;
    onSave(contact.id, { id: generateId(), date, note: note.trim() });
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div data-testid="log-interaction-modal">
        <h2 className="text-lg font-bold text-foreground mb-1">Log Interaction</h2>
        <p className="text-muted-foreground text-sm mb-4">with {contact.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-muted-foreground text-sm mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-muted-foreground text-sm mb-1">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Had coffee, discussed job opportunity..."
              rows={3}
              className="w-full bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              data-testid="interaction-note-input"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-foreground hover:bg-foreground/90 text-background font-semibold py-2 text-sm transition-colors">
              Log
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-secondary text-foreground font-semibold py-2 text-sm hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function ContactCard({ contact, onDelete, onLogInteraction }) {
  const [expanded, setExpanded] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [draftResult, setDraftResult] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState(null);
  const [meetingResult, setMeetingResult] = useState(null);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingError, setMeetingError] = useState(null);
  const [meetingContext, setMeetingContext] = useState('');
  const { generate, hasKey } = useGemini();

  const overdue = isOverdue(contact);
  const lastInteraction = (contact.interactions || []).sort((a, b) => b.date.localeCompare(a.date))[0];
  const recent = (contact.interactions || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const days = daysSince(contact.lastTouched);

  async function handleDraftOutreach() {
    setDraftLoading(true);
    setDraftError(null);
    setDraftResult(null);
    try {
      const lastNote = lastInteraction?.note || 'no recent interaction';
      const prompt = `Draft a short, natural check-in message to ${contact.name} who works as ${contact.role || 'professional'} at ${contact.company || 'their company'}. Last interaction: "${lastNote}". Keep it friendly, genuine, and under 4 sentences. Do NOT use cliches or "I hope this finds you well".`;
      const text = await generate(prompt);
      setDraftResult(text);
    } catch (err) {
      setDraftError(err.message);
    } finally {
      setDraftLoading(false);
    }
  }

  async function handleMeetingPrep() {
    setMeetingLoading(true);
    setMeetingError(null);
    setMeetingResult(null);
    try {
      const prompt = `I have a meeting with ${contact.name} (${contact.role || 'unknown role'} at ${contact.company || 'unknown company'}). Context: "${meetingContext || 'general catch-up'}". Previous interactions: ${(contact.interactions || []).map((i) => i.note).join('; ') || 'none'}. Provide 4-5 specific talking points as a bullet list. Be concise and practical.`;
      const text = await generate(prompt);
      setMeetingResult(text);
    } catch (err) {
      setMeetingError(err.message);
    } finally {
      setMeetingLoading(false);
    }
  }

  return (
    <div
      className={`bg-secondary border p-4 ${overdue ? 'border-amber-500/50' : 'border-border'}`}
      data-testid={`contact-card-${contact.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-foreground font-semibold">{contact.name}</h3>
            {overdue && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full" data-testid={`overdue-badge-${contact.id}`}>
                Follow-up overdue
              </span>
            )}
          </div>
          {(contact.role || contact.company) && (
            <p className="text-muted-foreground text-sm">{[contact.role, contact.company].filter(Boolean).join(' @ ')}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {(contact.tags || []).map((tag) => (
              <span key={tag} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded" data-testid={`tag-${contact.id}-${tag}`}>
                {tag}
              </span>
            ))}
          </div>
          <p className="text-muted-foreground/80 text-xs mt-1">
            {contact.lastTouched ? `Last touched: ${days === 0 ? 'today' : `${days}d ago`}` : 'Never touched'}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground/80 hover:text-foreground px-1 text-sm"
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(contact.id)}
            className="text-muted-foreground/80 hover:text-red-400 px-1 text-sm"
            data-testid={`delete-contact-${contact.id}`}
          >
            ×
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Contact details */}
          <div className="space-y-1 text-sm">
            {contact.email && <p className="text-muted-foreground">📧 <a href={`mailto:${contact.email}`} className="hover:text-amber-400">{contact.email}</a></p>}
            {contact.linkedin && <p className="text-muted-foreground">🔗 <a href={contact.linkedin} target="_blank" rel="noreferrer" className="hover:text-amber-400">LinkedIn</a></p>}
            {contact.whereMet && <p className="text-muted-foreground">📍 Met at: {contact.whereMet}</p>}
          </div>

          {/* Recent interactions */}
          {recent.length > 0 && (
            <div>
              <p className="text-muted-foreground/80 text-xs uppercase tracking-wider mb-2">Recent Interactions</p>
              <div className="space-y-2">
                {recent.map((int) => (
                  <div key={int.id} className="text-sm">
                    <span className="text-muted-foreground/80 text-xs">{int.date}</span>
                    <p className="text-muted-foreground">{int.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log interaction button */}
          <button
            type="button"
            onClick={() => setShowLog(true)}
            className="text-sm text-foreground hover:underline border border-amber-500/30 px-3 py-1.5 transition-colors"
            data-testid={`log-interaction-btn-${contact.id}`}
          >
            + Log Interaction
          </button>

          {/* AI Gemini actions */}
          {hasKey && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDraftOutreach}
                  disabled={draftLoading}
                  className="text-sm text-foreground hover:underline disabled:opacity-40 border border-amber-500/30 px-3 py-1.5 transition-colors"
                  data-testid={`draft-outreach-btn-${contact.id}`}
                >
                  {draftLoading ? '⏳ Drafting…' : '✨ Draft outreach'}
                </button>
              </div>
              <AiSuggestion loading={draftLoading} result={draftResult} error={draftError} />

              <div className="space-y-2">
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    value={meetingContext}
                    onChange={(e) => setMeetingContext(e.target.value)}
                    placeholder="Meeting context (optional)"
                    className="flex-1 min-w-0 bg-background border border-border px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={handleMeetingPrep}
                    disabled={meetingLoading}
                    className="text-sm text-foreground hover:underline disabled:opacity-40 border border-amber-500/30 px-3 py-1.5 transition-colors shrink-0"
                    data-testid={`meeting-prep-btn-${contact.id}`}
                  >
                    {meetingLoading ? '⏳ Preparing…' : '✨ Meeting prep'}
                  </button>
                </div>
                <AiSuggestion loading={meetingLoading} result={meetingResult} error={meetingError} />
              </div>
            </div>
          )}
        </div>
      )}

      {showLog && (
        <LogInteractionModal
          contact={contact}
          onSave={(id, interaction) => {
            onLogInteraction(id, interaction);
            setShowLog(false);
          }}
          onClose={() => setShowLog(false)}
        />
      )}
    </div>
  );
}

export function NetworkingTab() {
  const [contacts, setContacts] = useIDB('contacts', []);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  function handleAddContact(data) {
    setContacts((prev) => [...prev, { ...data, id: generateId() }]);
    setShowAdd(false);
  }

  function handleDeleteContact(id) {
    setDeleteTarget(id);
  }
  function confirmDeleteContact() {
    setContacts((prev) => prev.filter((c) => c.id !== deleteTarget));
    setDeleteTarget(null);
  }

  function handleLogInteraction(contactId, interaction) {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? {
              ...c,
              lastTouched: interaction.date,
              interactions: [...(c.interactions || []), interaction],
            }
          : c
      )
    );
  }

  // All tags for filter
  const allTags = useMemo(() => {
    const set = new Set();
    (contacts || []).forEach((c) => (c.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [contacts]);

  // Filter contacts
  const filtered = useMemo(() => {
    let list = contacts || [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.role?.toLowerCase().includes(q)
      );
    }
    if (filterTag) {
      list = list.filter((c) => (c.tags || []).includes(filterTag));
    }
    return list;
  }, [contacts, search, filterTag]);

  // Overdue contacts
  const overdueContacts = useMemo(
    () => (contacts || []).filter(isOverdue),
    [contacts]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Networking" subtitle="Contacts and relationship tracking">
        <ActionButton variant="primary" onClick={() => setShowAdd(true)} data-testid="add-contact-btn">
          + Add Contact
        </ActionButton>
      </PageHeader>

      {/* Overdue banner */}
      {overdueContacts.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/30 p-4" data-testid="overdue-banner">
          <p className="text-amber-400 text-sm font-semibold">
            {overdueContacts.length} contact{overdueContacts.length !== 1 ? 's' : ''} due for follow-up
          </p>
          <p className="text-amber-400/70 text-xs mt-0.5">
            {overdueContacts.map((c) => c.name).join(', ')}
          </p>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts…"
          className="flex-1 min-w-0 bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          data-testid="contact-search"
        />
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            data-testid="tag-filter"
          >
            <option value="">All tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Contact list */}
      {(!contacts || contacts.length === 0) ? (
        <EmptyState
          title="No contacts yet"
          description="Start building your professional network."
          action={
            <ActionButton variant="primary" onClick={() => setShowAdd(true)}>
              Add Contact
            </ActionButton>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No contacts found"
          description="Try a different search or filter."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onDelete={handleDeleteContact}
              onLogInteraction={handleLogInteraction}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddContactModal
          onSave={handleAddContact}
          onClose={() => setShowAdd(false)}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteContact}
        title="Delete contact?"
        message="This will permanently delete this contact and their interaction history."
      />
    </div>
  );
}
