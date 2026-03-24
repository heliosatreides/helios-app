import { useState } from 'react';
import { useGemini } from '../../hooks/useGemini';
import {
  buildBulletRewritePrompt,
  buildSummaryImprovePrompt,
  buildJobTailoringPrompt,
  parseBulletAlternatives,
} from './resumeGemini';

// ── Collapsible Section ──────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-secondary border border-border mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-semibold text-foreground">{title}</span>
        <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ── Field helpers ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-secondary border border-[#3f3f46] px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-amber-500"
      />
    </div>
  );
}

// ── Skills tag input ─────────────────────────────────────────────────────────
function SkillTagInput({ label, skills, onAdd, onRemove }) {
  const [input, setInput] = useState('');
  function handleKey(e) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      onAdd(input);
      setInput('');
    }
  }
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {skills.map((skill, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-secondary text-foreground border border-amber-500/30 rounded-full px-2.5 py-0.5 text-xs">
            {skill}
            <button onClick={() => onRemove(i)} className="text-amber-500/70 hover:text-amber-400 ml-0.5">×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Type skill + Enter"
        className="w-full bg-secondary border border-[#3f3f46] px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-amber-500"
      />
    </div>
  );
}

// ── Bullet row with optional Gemini rewrite ──────────────────────────────────
function BulletRow({ bullet, index, expId, jobContext, onUpdate, onRemove, hasKey }) {
  const { generate } = useGemini();
  const [alts, setAlts] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleRewrite() {
    setLoading(true);
    try {
      const prompt = buildBulletRewritePrompt(bullet, jobContext);
      const result = await generate(prompt);
      setAlts(parseBulletAlternatives(result));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-2">
      <div className="flex gap-2 items-start">
        <span className="text-muted-foreground/80 mt-2.5 cursor-grab select-none">⠿</span>
        <input
          type="text"
          value={bullet}
          onChange={(e) => onUpdate(index, e.target.value)}
          placeholder="Bullet point..."
          className="flex-1 bg-secondary border border-[#3f3f46] px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-amber-500"
        />
        {hasKey && (
          <button
            onClick={handleRewrite}
            disabled={loading || !bullet.trim()}
            className="px-2 py-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 text-xs hover:bg-violet-600/30 disabled:opacity-40 whitespace-nowrap"
            title="Rewrite with AI"
          >
            {loading ? '⏳' : '✨'}
          </button>
        )}
        <button
          onClick={() => onRemove(index)}
          className="px-2 py-2 text-muted-foreground/80 hover:text-red-400 text-lg leading-none"
          title="Remove bullet"
        >
          ×
        </button>
      </div>
      {alts.length > 0 && (
        <div className="mt-1 ml-6 bg-background border border-violet-500/30 p-2 space-y-1">
          <p className="text-xs text-muted-foreground mb-1">Pick an alternative:</p>
          {alts.map((alt, i) => (
            <button
              key={i}
              onClick={() => { onUpdate(index, alt); setAlts([]); }}
              className="w-full text-left text-xs text-muted-foreground hover:text-foreground py-1 px-2 rounded hover:bg-secondary"
            >
              {i + 1}. {alt}
            </button>
          ))}
          <button onClick={() => setAlts([])} className="text-xs text-muted-foreground/80 hover:text-muted-foreground mt-1">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Edit component ──────────────────────────────────────────────────────
export function ResumeEdit({ resumeData, actions }) {
  const { generate, hasKey } = useGemini();
  const [tailorOpen, setTailorOpen] = useState(false);
  const [jobDesc, setJobDesc] = useState('');
  const [tailoring, setTailoring] = useState(false);
  const [improvingSummary, setImprovingSummary] = useState(false);

  async function handleTailor() {
    if (!jobDesc.trim()) return;
    setTailoring(true);
    try {
      const prompt = buildJobTailoringPrompt(resumeData, jobDesc);
      await generate(prompt);
      // Response is shown as info; could parse and apply
    } catch {
      // ignore
    } finally {
      setTailoring(false);
      setTailorOpen(false);
    }
  }

  async function handleImproveSummary() {
    if (!resumeData.summary) return;
    setImprovingSummary(true);
    try {
      const prompt = buildSummaryImprovePrompt(resumeData.summary);
      const result = await generate(prompt);
      actions.updateSummary(result.trim());
    } catch {
      // ignore
    } finally {
      setImprovingSummary(false);
    }
  }

  return (
    <div>
      {/* Tailor for Job (Gemini) */}
      {hasKey && (
        <div className="mb-4">
          {!tailorOpen ? (
            <button
              onClick={() => setTailorOpen(true)}
              className="px-4 py-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 text-sm hover:bg-violet-600/30"
            >
              ✨ Tailor for Job
            </button>
          ) : (
            <div className="bg-secondary border border-violet-500/30 p-4">
              <p className="text-sm text-muted-foreground mb-2">Paste the job description:</p>
              <textarea
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                rows={4}
                className="w-full bg-secondary border border-[#3f3f46] px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-amber-500"
                placeholder="Paste job description here..."
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleTailor}
                  disabled={tailoring || !jobDesc.trim()}
                  className="px-3 py-1.5 bg-violet-600 text-white text-sm hover:bg-violet-500 disabled:opacity-50"
                >
                  {tailoring ? '⏳ Tailoring...' : '✨ Tailor Resume'}
                </button>
                <button
                  onClick={() => { setTailorOpen(false); setJobDesc(''); }}
                  className="px-3 py-1.5 text-muted-foreground hover:text-foreground text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <Section title="Header">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full Name" value={resumeData.header?.fullName} onChange={(v) => actions.updateHeader('fullName', v)} placeholder="Jane Doe" />
          <Field label="Job Title" value={resumeData.header?.jobTitle} onChange={(v) => actions.updateHeader('jobTitle', v)} placeholder="Software Engineer" />
          <Field label="Email" value={resumeData.header?.email} onChange={(v) => actions.updateHeader('email', v)} placeholder="jane@example.com" type="email" />
          <Field label="Phone" value={resumeData.header?.phone} onChange={(v) => actions.updateHeader('phone', v)} placeholder="+1 (555) 123-4567" />
          <Field label="Location" value={resumeData.header?.location} onChange={(v) => actions.updateHeader('location', v)} placeholder="San Francisco, CA" />
          <Field label="LinkedIn URL" value={resumeData.header?.linkedin} onChange={(v) => actions.updateHeader('linkedin', v)} placeholder="linkedin.com/in/janedoe" />
          <Field label="GitHub URL" value={resumeData.header?.github} onChange={(v) => actions.updateHeader('github', v)} placeholder="github.com/janedoe" />
          <Field label="Website" value={resumeData.header?.website} onChange={(v) => actions.updateHeader('website', v)} placeholder="janedoe.dev" />
        </div>
      </Section>

      {/* Summary */}
      <Section title="Summary">
        <div>
          <textarea
            value={resumeData.summary || ''}
            onChange={(e) => actions.updateSummary(e.target.value)}
            rows={4}
            placeholder="2-4 sentence professional summary..."
            className="w-full bg-secondary border border-[#3f3f46] px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-amber-500"
          />
          {hasKey && (
            <button
              onClick={handleImproveSummary}
              disabled={improvingSummary || !resumeData.summary}
              className="mt-2 px-3 py-1.5 bg-violet-600/20 text-violet-400 border border-violet-500/30 text-xs hover:bg-violet-600/30 disabled:opacity-40"
            >
              {improvingSummary ? '⏳ Improving...' : '✨ Improve Summary'}
            </button>
          )}
        </div>
      </Section>

      {/* Experience */}
      <Section title="Experience">
        {resumeData.experience?.map((exp) => (
          <div key={exp.id} className="border border-[#3f3f46] p-4 mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Field label="Company" value={exp.company} onChange={(v) => actions.updateExperience(exp.id, 'company', v)} placeholder="Tech Corp" />
              <Field label="Role" value={exp.role} onChange={(v) => actions.updateExperience(exp.id, 'role', v)} placeholder="Senior Engineer" />
              <Field label="Start Date" value={exp.startDate} onChange={(v) => actions.updateExperience(exp.id, 'startDate', v)} placeholder="Jan 2022" />
              <div>
                <label className="block text-xs text-muted-foreground mb-1">End Date</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={exp.endDate || ''}
                    onChange={(e) => actions.updateExperience(exp.id, 'endDate', e.target.value)}
                    disabled={exp.present}
                    placeholder="Dec 2023"
                    className="flex-1 bg-secondary border border-[#3f3f46] px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exp.present || false}
                      onChange={(e) => actions.updateExperience(exp.id, 'present', e.target.checked)}
                      className="accent-amber-500"
                    />
                    Present
                  </label>
                </div>
              </div>
              <Field label="Location" value={exp.location} onChange={(v) => actions.updateExperience(exp.id, 'location', v)} placeholder="Remote" />
            </div>

            <div className="mb-2">
              <label className="block text-xs text-muted-foreground mb-1">Bullet Points</label>
              {exp.bullets.map((bullet, i) => (
                <BulletRow
                  key={i}
                  bullet={bullet}
                  index={i}
                  expId={exp.id}
                  jobContext={{ company: exp.company, role: exp.role }}
                  onUpdate={(idx, val) => actions.updateBullet(exp.id, idx, val)}
                  onRemove={(idx) => actions.removeBullet(exp.id, idx)}
                  hasKey={hasKey}
                />
              ))}
              <button
                onClick={() => actions.addBullet(exp.id)}
                className="text-xs text-foreground hover:underline mt-1"
              >
                + Add bullet
              </button>
            </div>

            <button
              onClick={() => actions.removeExperience(exp.id)}
              className="text-xs text-muted-foreground/80 hover:text-red-400"
            >
              Remove job
            </button>
          </div>
        ))}
        <button
          onClick={actions.addExperience}
          className="w-full border border-dashed border-[#3f3f46] hover:border-amber-500/50 py-2.5 text-sm text-muted-foreground hover:text-amber-400 transition-colors"
        >
          + Add Experience
        </button>
      </Section>

      {/* Education */}
      <Section title="Education" defaultOpen={false}>
        {resumeData.education?.map((edu) => (
          <div key={edu.id} className="border border-[#3f3f46] p-4 mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Degree" value={edu.degree} onChange={(v) => actions.updateEducation(edu.id, 'degree', v)} placeholder="BS Computer Science" />
              <Field label="Institution" value={edu.institution} onChange={(v) => actions.updateEducation(edu.id, 'institution', v)} placeholder="State University" />
              <Field label="Year" value={edu.year} onChange={(v) => actions.updateEducation(edu.id, 'year', v)} placeholder="2023" />
              <Field label="GPA (optional)" value={edu.gpa} onChange={(v) => actions.updateEducation(edu.id, 'gpa', v)} placeholder="3.8" />
            </div>
            <button onClick={() => actions.removeEducation(edu.id)} className="mt-2 text-xs text-muted-foreground/80 hover:text-red-400">
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={actions.addEducation}
          className="w-full border border-dashed border-[#3f3f46] hover:border-amber-500/50 py-2.5 text-sm text-muted-foreground hover:text-amber-400 transition-colors"
        >
          + Add Education
        </button>
      </Section>

      {/* Skills */}
      <Section title="Skills" defaultOpen={false}>
        <div className="space-y-4">
          <SkillTagInput
            label="Technical Skills"
            skills={resumeData.skills?.technical || []}
            onAdd={(s) => actions.addSkill('technical', s)}
            onRemove={(i) => actions.removeSkill('technical', i)}
          />
          <SkillTagInput
            label="Tools"
            skills={resumeData.skills?.tools || []}
            onAdd={(s) => actions.addSkill('tools', s)}
            onRemove={(i) => actions.removeSkill('tools', i)}
          />
          <SkillTagInput
            label="Soft Skills"
            skills={resumeData.skills?.soft || []}
            onAdd={(s) => actions.addSkill('soft', s)}
            onRemove={(i) => actions.removeSkill('soft', i)}
          />
        </div>
      </Section>

      {/* Certifications */}
      <Section title="Certifications" defaultOpen={false}>
        {resumeData.certifications?.map((cert) => (
          <div key={cert.id} className="border border-[#3f3f46] p-4 mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Name" value={cert.name} onChange={(v) => actions.updateCertification(cert.id, 'name', v)} placeholder="AWS Solutions Architect" />
              <Field label="Issuer" value={cert.issuer} onChange={(v) => actions.updateCertification(cert.id, 'issuer', v)} placeholder="Amazon" />
              <Field label="Year" value={cert.year} onChange={(v) => actions.updateCertification(cert.id, 'year', v)} placeholder="2023" />
            </div>
            <button onClick={() => actions.removeCertification(cert.id)} className="mt-2 text-xs text-muted-foreground/80 hover:text-red-400">
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={actions.addCertification}
          className="w-full border border-dashed border-[#3f3f46] hover:border-amber-500/50 py-2.5 text-sm text-muted-foreground hover:text-amber-400 transition-colors"
        >
          + Add Certification
        </button>
      </Section>

      {/* Projects */}
      <Section title="Projects" defaultOpen={false}>
        {resumeData.projects?.map((proj) => (
          <div key={proj.id} className="border border-[#3f3f46] p-4 mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Field label="Name" value={proj.name} onChange={(v) => actions.updateProject(proj.id, 'name', v)} placeholder="My Project" />
              <Field label="URL" value={proj.url} onChange={(v) => actions.updateProject(proj.id, 'url', v)} placeholder="https://github.com/..." />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1">Description</label>
              <textarea
                value={proj.description || ''}
                onChange={(e) => actions.updateProject(proj.id, 'description', e.target.value)}
                rows={2}
                placeholder="Brief description..."
                className="w-full bg-secondary border border-[#3f3f46] px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-amber-500"
              />
            </div>
            <SkillTagInput
              label="Tech Stack"
              skills={proj.tags || []}
              onAdd={(t) => actions.addProjectTag(proj.id, t)}
              onRemove={(i) => actions.removeProjectTag(proj.id, i)}
            />
            <button onClick={() => actions.removeProject(proj.id)} className="mt-2 text-xs text-muted-foreground/80 hover:text-red-400">
              Remove project
            </button>
          </div>
        ))}
        <button
          onClick={actions.addProject}
          className="w-full border border-dashed border-[#3f3f46] hover:border-amber-500/50 py-2.5 text-sm text-muted-foreground hover:text-amber-400 transition-colors"
        >
          + Add Project
        </button>
      </Section>
    </div>
  );
}
