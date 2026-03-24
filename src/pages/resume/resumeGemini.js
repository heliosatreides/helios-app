/**
 * Prompt builders for Resume Gemini integration.
 */

export function buildBulletRewritePrompt(bullet, jobContext = {}) {
  const { company = '', role = '' } = jobContext;
  return `You are a professional resume writer. Rewrite the following resume bullet point to be more impactful, quantified, and action-verb-led. Return exactly 3 alternatives, each on its own line, prefixed with a number (1., 2., 3.). Do not add any other text.

Job context: ${role}${company ? ` at ${company}` : ''}
Original bullet: ${bullet}`;
}

export function buildSummaryImprovePrompt(summary) {
  return `You are a professional resume writer. Rewrite the following professional summary to be more impactful, concise (2-4 sentences), and compelling to hiring managers. Return only the improved summary text with no additional commentary.

Original summary: ${summary}`;
}

export function buildJobTailoringPrompt(resumeData, jobDescription) {
  const name = resumeData?.header?.fullName || 'Candidate';
  const currentSummary = resumeData?.summary || '';
  const experience = (resumeData?.experience || [])
    .map((e) => `${e.role} at ${e.company}: ${(e.bullets || []).join('; ')}`)
    .join('\n');

  return `You are a professional resume writer helping tailor a resume for a specific job.

Candidate: ${name}
Current Summary: ${currentSummary}
Experience:
${experience}

Job Description:
${jobDescription}

Please provide:
1. A tailored summary (2-4 sentences) that aligns with this job
2. The top 3 experience bullet points from the resume that are most relevant to this role

Format your response as:
SUMMARY:
[tailored summary here]

RELEVANT BULLETS:
- [bullet 1]
- [bullet 2]
- [bullet 3]`;
}

export function buildScoreResumePrompt(resumeText) {
  return `You are an expert resume reviewer. Analyze the following resume and provide:
1. A score out of 10
2. Exactly 3 specific, actionable improvement suggestions

Format your response as:
SCORE: [number]/10

SUGGESTIONS:
1. [suggestion 1]
2. [suggestion 2]
3. [suggestion 3]

Resume:
${resumeText}`;
}

export function parseScoreResponse(text) {
  const scoreMatch = text.match(/SCORE:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

  const suggestionsMatch = text.match(/SUGGESTIONS:\s*([\s\S]+)/i);
  const suggestions = suggestionsMatch
    ? suggestionsMatch[1]
        .split('\n')
        .filter((l) => l.match(/^\d+\./))
        .map((l) => l.replace(/^\d+\.\s*/, '').trim())
    : [];

  return { score, suggestions };
}

export function parseBulletAlternatives(text) {
  return text
    .split('\n')
    .filter((l) => l.match(/^\d+\./))
    .map((l) => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function resumeToText(resumeData) {
  if (!resumeData) return '';
  const lines = [];

  const h = resumeData.header || {};
  if (h.fullName) lines.push(h.fullName);
  if (h.jobTitle) lines.push(h.jobTitle);
  const contact = [h.email, h.phone, h.location, h.linkedin, h.github, h.website]
    .filter(Boolean)
    .join(' | ');
  if (contact) lines.push(contact);

  if (resumeData.summary) {
    lines.push('\nSUMMARY');
    lines.push(resumeData.summary);
  }

  if (resumeData.experience?.length) {
    lines.push('\nEXPERIENCE');
    resumeData.experience.forEach((e) => {
      lines.push(`${e.role} at ${e.company}`);
      lines.push(`${e.startDate} - ${e.present ? 'Present' : e.endDate}`);
      (e.bullets || []).forEach((b) => lines.push(`• ${b}`));
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
  const allSkills = [
    ...(skills.technical || []),
    ...(skills.tools || []),
    ...(skills.soft || []),
  ];
  if (allSkills.length) {
    lines.push('\nSKILLS');
    lines.push(allSkills.join(', '));
  }

  if (resumeData.certifications?.length) {
    lines.push('\nCERTIFICATIONS');
    resumeData.certifications.forEach((c) => {
      lines.push(`${c.name} - ${c.issuer} (${c.year})`);
    });
  }

  if (resumeData.projects?.length) {
    lines.push('\nPROJECTS');
    resumeData.projects.forEach((p) => {
      lines.push(`${p.name}: ${p.description}`);
      if (p.url) lines.push(p.url);
      if (p.tags?.length) lines.push(p.tags.join(', '));
    });
  }

  return lines.join('\n');
}
