import { useState } from 'react';
import { useGemini } from '../../hooks/useGemini';
import { buildScoreResumePrompt, parseScoreResponse, resumeToText } from './resumeGemini';

export function ResumePreview({ resumeData }) {
  const { generate, loading, hasKey } = useGemini();
  const [scoreResult, setScoreResult] = useState(null);
  const [scoring, setScoring] = useState(false);

  const h = resumeData?.header || {};

  async function handleScore() {
    setScoring(true);
    try {
      const text = resumeToText(resumeData);
      const prompt = buildScoreResumePrompt(text);
      const result = await generate(prompt);
      setScoreResult(parseScoreResponse(result));
    } catch {
      // ignore
    } finally {
      setScoring(false);
    }
  }

  const contactParts = [h.email, h.phone, h.location, h.linkedin, h.github, h.website].filter(Boolean);

  return (
    <div className="flex gap-6">
      {/* Resume content */}
      <div id="resume-preview" className="flex-1 bg-white text-gray-900 p-8 rounded-lg shadow-lg font-serif max-w-3xl">
        {/* Header */}
        <div className="text-center mb-4">
          {h.fullName && (
            <h1 className="text-3xl font-bold text-gray-900">{h.fullName}</h1>
          )}
          {h.jobTitle && (
            <p className="text-lg text-gray-600 mt-1">{h.jobTitle}</p>
          )}
          {contactParts.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">{contactParts.join(' · ')}</p>
          )}
        </div>

        <hr className="border-gray-300 mb-4" />

        {/* Summary */}
        {resumeData?.summary && (
          <section className="mb-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
              Summary
            </h2>
            <p className="text-sm text-gray-800 leading-relaxed">{resumeData.summary}</p>
          </section>
        )}

        {/* Experience */}
        {resumeData?.experience?.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
              Experience
            </h2>
            {resumeData.experience.map((exp) => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-gray-900">{exp.role}</span>
                    {exp.company && <span className="text-gray-700"> · {exp.company}</span>}
                    {exp.location && <span className="text-gray-500 text-sm"> · {exp.location}</span>}
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {exp.startDate}{exp.startDate && (exp.endDate || exp.present) ? ' – ' : ''}
                    {exp.present ? 'Present' : exp.endDate}
                  </span>
                </div>
                {exp.bullets?.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {exp.bullets.filter(Boolean).map((bullet, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="mt-1 shrink-0">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {resumeData?.education?.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
              Education
            </h2>
            {resumeData.education.map((edu) => (
              <div key={edu.id} className="mb-2 flex justify-between">
                <div>
                  <span className="font-semibold text-gray-900">{edu.degree}</span>
                  {edu.institution && <span className="text-gray-700"> · {edu.institution}</span>}
                  {edu.gpa && <span className="text-gray-500 text-sm"> · GPA: {edu.gpa}</span>}
                </div>
                {edu.year && <span className="text-xs text-gray-500">{edu.year}</span>}
              </div>
            ))}
          </section>
        )}

        {/* Skills */}
        {(resumeData?.skills?.technical?.length > 0 ||
          resumeData?.skills?.tools?.length > 0 ||
          resumeData?.skills?.soft?.length > 0) && (
          <section className="mb-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
              Skills
            </h2>
            <div className="space-y-1">
              {resumeData.skills.technical?.length > 0 && (
                <p className="text-sm text-gray-800">
                  <span className="font-medium">Technical: </span>
                  {resumeData.skills.technical.join(', ')}
                </p>
              )}
              {resumeData.skills.tools?.length > 0 && (
                <p className="text-sm text-gray-800">
                  <span className="font-medium">Tools: </span>
                  {resumeData.skills.tools.join(', ')}
                </p>
              )}
              {resumeData.skills.soft?.length > 0 && (
                <p className="text-sm text-gray-800">
                  <span className="font-medium">Soft Skills: </span>
                  {resumeData.skills.soft.join(', ')}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Certifications */}
        {resumeData?.certifications?.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
              Certifications
            </h2>
            {resumeData.certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between mb-1">
                <span className="text-sm text-gray-800">
                  <span className="font-medium">{cert.name}</span>
                  {cert.issuer && <span className="text-gray-600"> · {cert.issuer}</span>}
                </span>
                {cert.year && <span className="text-xs text-gray-500">{cert.year}</span>}
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {resumeData?.projects?.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
              Projects
            </h2>
            {resumeData.projects.map((proj) => (
              <div key={proj.id} className="mb-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">{proj.name}</span>
                  {proj.url && (
                    <a href={proj.url} className="text-xs text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      {proj.url}
                    </a>
                  )}
                </div>
                {proj.description && <p className="text-sm text-gray-700">{proj.description}</p>}
                {proj.tags?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">{proj.tags.join(', ')}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Print button */}
        <div className="mt-6 flex gap-3 no-print">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
            aria-label="Print or save as PDF"
          >
            🖨️ Print / Save as PDF
          </button>
          {hasKey && (
            <button
              onClick={handleScore}
              disabled={scoring || loading}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-500 transition-colors disabled:opacity-50"
            >
              {scoring ? '⏳ Scoring...' : '✨ Score My Resume'}
            </button>
          )}
        </div>
      </div>

      {/* Score panel */}
      {scoreResult && (
        <div className="w-64 shrink-0 bg-[#1c1c1f] border border-[#27272a] rounded-lg p-4 h-fit">
          <h3 className="text-[#e4e4e7] font-semibold mb-3">Resume Score</h3>
          <div className="text-4xl font-bold text-amber-400 mb-1">
            {scoreResult.score}<span className="text-lg text-[#71717a]">/10</span>
          </div>
          {scoreResult.suggestions.length > 0 && (
            <>
              <p className="text-[#71717a] text-xs mt-3 mb-2 uppercase tracking-wider font-medium">Suggestions</p>
              <ul className="space-y-2">
                {scoreResult.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-[#a1a1aa] flex gap-2">
                    <span className="text-amber-400 shrink-0">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <button
            onClick={() => setScoreResult(null)}
            className="mt-4 text-xs text-[#52525b] hover:text-[#71717a]"
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}
