/**
 * Resume Gemini integration — schemas and helpers.
 */

// ── Schemas for structured output ──

export const SCORE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    score: { type: 'NUMBER', description: 'Score out of 10' },
    suggestions: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Exactly 3 specific, actionable improvement suggestions',
    },
  },
  required: ['score', 'suggestions'],
};

export const BULLET_ALTERNATIVES_SCHEMA = {
  type: 'ARRAY',
  items: { type: 'STRING', description: 'Rewritten bullet point' },
};

export const JOB_TAILORING_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: 'Tailored 2-4 sentence summary' },
    relevantBullets: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Top 3 most relevant experience bullet points',
    },
  },
  required: ['summary', 'relevantBullets'],
};

// ── Prompt builders ──

export function buildBulletRewritePrompt(bullet, jobContext = {}) {
  const { company = '', role = '' } = jobContext;
  return `Rewrite this resume bullet point into 3 more impactful alternatives. Each should be quantified, action-verb-led, and concise.

Job context: ${role}${company ? ` at ${company}` : ''}
Original: ${bullet}`;
}

export function buildSummaryImprovePrompt(summary) {
  return `Rewrite this professional summary to be more compelling, concise (2-4 sentences), and impactful for hiring managers. Return only the improved text.

Original: ${summary}`;
}

export function buildJobTailoringPrompt(resumeData, jobDescription) {
  const name = resumeData?.header?.fullName || 'Candidate';
  const currentSummary = resumeData?.summary || '';
  const experience = (resumeData?.experience || [])
    .map((e) => `${e.role} at ${e.company}: ${(e.bullets || []).join('; ')}`)
    .join('\n');

  return `Tailor this resume for the job description below.

Candidate: ${name}
Current Summary: ${currentSummary}
Experience:
${experience}

Job Description:
${jobDescription}`;
}

export function buildScoreResumePrompt(resumeText) {
  return `Analyze this resume and provide a score out of 10 with exactly 3 specific, actionable suggestions.

Resume:
${resumeText}`;
}

// ── Legacy parsers (kept for backward compat but structured output makes these unnecessary) ──

export function parseScoreResponse(data) {
  if (typeof data === 'object' && data.score !== undefined) return data;
  // Fallback text parsing
  const text = String(data);
  const scoreMatch = text.match(/(\d+(?:\.\d+)?)\s*\/\s*10/i);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
  const suggestions = text.split('\n').filter(l => l.match(/^\d+\./)).map(l => l.replace(/^\d+\.\s*/, '').trim());
  return { score, suggestions };
}

export function parseBulletAlternatives(data) {
  if (Array.isArray(data)) return data.slice(0, 3);
  return String(data).split('\n').filter(l => l.match(/^\d+\./)).map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean).slice(0, 3);
}

export function resumeToText(resumeData) {
  if (!resumeData) return '';
  const lines = [];

  const h = resumeData.header || {};
  if (h.fullName) lines.push(h.fullName);
  if (h.jobTitle) lines.push(h.jobTitle);
  const contact = [h.email, h.phone, h.location, h.linkedin, h.github, h.website].filter(Boolean).join(' | ');
  if (contact) lines.push(contact);

  if (resumeData.summary) { lines.push('\nSUMMARY'); lines.push(resumeData.summary); }

  if (resumeData.experience?.length) {
    lines.push('\nEXPERIENCE');
    resumeData.experience.forEach((e) => {
      lines.push(`${e.role} at ${e.company}`);
      lines.push(`${e.startDate} - ${e.present ? 'Present' : e.endDate}`);
      (e.bullets || []).forEach((b) => lines.push(`- ${b}`));
    });
  }

  if (resumeData.education?.length) {
    lines.push('\nEDUCATION');
    resumeData.education.forEach((e) => {
      lines.push(`${e.degree} - ${e.institution} (${e.year})`);
      if (e.gpa) lines.push(`GPA: ${e.gpa}`);
    });
  }

  const skills = resumeData.skills || {};
  const allSkills = [...(skills.technical || []), ...(skills.tools || []), ...(skills.soft || [])];
  if (allSkills.length) { lines.push('\nSKILLS'); lines.push(allSkills.join(', ')); }

  if (resumeData.certifications?.length) {
    lines.push('\nCERTIFICATIONS');
    resumeData.certifications.forEach((c) => lines.push(`${c.name} - ${c.issuer} (${c.year})`));
  }

  if (resumeData.projects?.length) {
    lines.push('\nPROJECTS');
    resumeData.projects.forEach((p) => {
      lines.push(`${p.name}: ${p.description}`);
      if (p.url) lines.push(p.url);
    });
  }

  return lines.join('\n');
}
