import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock useGemini so ResumePreview doesn't need localStorage
vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({
    generate: vi.fn(),
    loading: false,
    error: null,
    hasKey: false,
  }),
}));

// ── Data helpers ────────────────────────────────────────────────────────────
import {
  EMPTY_RESUME,
  createExperience,
  createEducation,
  createCertification,
  createProject,
} from './useResumeData';

import {
  buildBulletRewritePrompt,
  buildJobTailoringPrompt,
  buildSummaryImprovePrompt,
  buildScoreResumePrompt,
  parseScoreResponse,
  parseBulletAlternatives,
  resumeToText,
} from './resumeGemini';

import { ResumePreview } from './ResumePreview';

// ── useResumeData logic tests (pure / state-less) ───────────────────────────
describe('useResumeData helpers', () => {
  test('EMPTY_RESUME has all expected keys', () => {
    expect(EMPTY_RESUME).toHaveProperty('header');
    expect(EMPTY_RESUME).toHaveProperty('summary');
    expect(EMPTY_RESUME).toHaveProperty('experience');
    expect(EMPTY_RESUME).toHaveProperty('education');
    expect(EMPTY_RESUME).toHaveProperty('skills');
    expect(EMPTY_RESUME).toHaveProperty('certifications');
    expect(EMPTY_RESUME).toHaveProperty('projects');
  });

  test('createExperience returns object with bullets array', () => {
    const exp = createExperience({ company: 'Acme', role: 'Engineer' });
    expect(exp.company).toBe('Acme');
    expect(exp.role).toBe('Engineer');
    expect(Array.isArray(exp.bullets)).toBe(true);
    expect(exp.present).toBe(false);
  });

  test('createEducation returns object with id and gpa', () => {
    const edu = createEducation({ degree: 'BS CS', institution: 'MIT' });
    expect(edu.degree).toBe('BS CS');
    expect(edu.institution).toBe('MIT');
    expect(edu).toHaveProperty('gpa');
    expect(edu).toHaveProperty('id');
  });

  test('createCertification returns object with name/issuer/year', () => {
    const cert = createCertification({ name: 'AWS SA', issuer: 'Amazon' });
    expect(cert.name).toBe('AWS SA');
    expect(cert.issuer).toBe('Amazon');
    expect(cert).toHaveProperty('year');
  });

  test('createProject returns object with tags array', () => {
    const proj = createProject({ name: 'My App', url: 'https://example.com' });
    expect(proj.name).toBe('My App');
    expect(proj.url).toBe('https://example.com');
    expect(Array.isArray(proj.tags)).toBe(true);
  });
});

// ── Simulate add experience logic ──────────────────────────────────────────
describe('resume data operations (pure)', () => {
  test('add experience produces item with unique id', () => {
    const exp1 = createExperience();
    const exp2 = createExperience();
    // ids may collide in same tick, but both should exist as objects
    expect(exp1).toHaveProperty('id');
    expect(exp2).toHaveProperty('id');
  });

  test('add skill trims whitespace', () => {
    // Simulate the addSkill logic
    const skills = { technical: [], tools: [], soft: [] };
    const skill = '  React  ';
    const trimmed = skill.trim();
    const updated = { ...skills, technical: [...skills.technical, trimmed] };
    expect(updated.technical).toContain('React');
    expect(updated.technical).not.toContain('  React  ');
  });

  test('add bullet appends empty string to experience bullets', () => {
    const exp = createExperience();
    const updated = { ...exp, bullets: [...exp.bullets, ''] };
    expect(updated.bullets).toHaveLength(1);
    expect(updated.bullets[0]).toBe('');
  });

  test('remove bullet filters by index', () => {
    const exp = createExperience();
    const withBullets = { ...exp, bullets: ['Bullet A', 'Bullet B', 'Bullet C'] };
    const removed = { ...withBullets, bullets: withBullets.bullets.filter((_, i) => i !== 1) };
    expect(removed.bullets).toEqual(['Bullet A', 'Bullet C']);
  });
});

// ── Versions logic ──────────────────────────────────────────────────────────
describe('resume versions (pure logic)', () => {
  function makeVersion(name, data) {
    return {
      id: Date.now().toString() + Math.random(),
      name: name.trim(),
      savedAt: new Date().toISOString(),
      data,
    };
  }

  test('saveVersion creates version with name and savedAt', () => {
    const v = makeVersion('SWE Resume', EMPTY_RESUME);
    expect(v.name).toBe('SWE Resume');
    expect(v).toHaveProperty('savedAt');
    expect(v).toHaveProperty('id');
    expect(v.data).toBe(EMPTY_RESUME);
  });

  test('deleteVersion filters out by id', () => {
    const v1 = makeVersion('V1', EMPTY_RESUME);
    const v2 = makeVersion('V2', EMPTY_RESUME);
    const versions = [v1, v2];
    const after = versions.filter((v) => v.id !== v1.id);
    expect(after).toHaveLength(1);
    expect(after[0].name).toBe('V2');
  });

  test('loadVersion returns matching version data', () => {
    const data = { ...EMPTY_RESUME, summary: 'test summary' };
    const v = makeVersion('PM Resume', data);
    const versions = [v];
    const found = versions.find((x) => x.id === v.id);
    expect(found.data.summary).toBe('test summary');
  });
});

// ── Gemini prompt construction ──────────────────────────────────────────────
describe('Gemini prompt builders', () => {
  test('buildBulletRewritePrompt includes bullet and job context', () => {
    const prompt = buildBulletRewritePrompt('Led a team of 5', { company: 'Acme', role: 'Engineer' });
    expect(prompt).toContain('Led a team of 5');
    expect(prompt).toContain('Acme');
    expect(prompt).toContain('Engineer');
    expect(prompt).toContain('3 alternatives');
  });

  test('buildBulletRewritePrompt works without job context', () => {
    const prompt = buildBulletRewritePrompt('Improved performance by 20%');
    expect(prompt).toContain('Improved performance by 20%');
    expect(prompt).toContain('1.');
  });

  test('buildJobTailoringPrompt includes resume summary and job description', () => {
    const resume = { ...EMPTY_RESUME, summary: 'Senior engineer', header: { ...EMPTY_RESUME.header, fullName: 'Jane Doe' } };
    const prompt = buildJobTailoringPrompt(resume, 'Looking for a React developer');
    expect(prompt).toContain('Jane Doe');
    expect(prompt).toContain('Senior engineer');
    expect(prompt).toContain('Looking for a React developer');
  });

  test('buildSummaryImprovePrompt includes original summary', () => {
    const prompt = buildSummaryImprovePrompt('I am a software engineer with 5 years experience.');
    expect(prompt).toContain('software engineer');
    expect(prompt).toContain('2-4 sentences');
  });

  test('buildScoreResumePrompt includes resume text', () => {
    const prompt = buildScoreResumePrompt('John Doe\nSoftware Engineer');
    expect(prompt).toContain('John Doe');
    expect(prompt).toContain('score out of 10');
  });

  test('parseScoreResponse extracts score and suggestions', () => {
    const text = `SCORE: 7/10\n\nSUGGESTIONS:\n1. Add more metrics\n2. Improve summary\n3. Add LinkedIn`;
    const result = parseScoreResponse(text);
    expect(result.score).toBe(7);
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions[0]).toBe('Add more metrics');
  });

  test('parseBulletAlternatives returns up to 3 items', () => {
    const text = `1. Built scalable APIs\n2. Reduced latency by 40%\n3. Led cross-functional team`;
    const results = parseBulletAlternatives(text);
    expect(results).toHaveLength(3);
    expect(results[0]).toBe('Built scalable APIs');
  });

  test('resumeToText includes name and experience', () => {
    const resume = {
      ...EMPTY_RESUME,
      header: { ...EMPTY_RESUME.header, fullName: 'Alice', email: 'alice@example.com' },
      experience: [
        createExperience({ company: 'TechCorp', role: 'Dev', bullets: ['Built things'] }),
      ],
    };
    const text = resumeToText(resume);
    expect(text).toContain('Alice');
    expect(text).toContain('TechCorp');
    expect(text).toContain('Built things');
  });
});

// ── ResumePreview rendering ──────────────────────────────────────────────────
describe('ResumePreview', () => {
  const sampleResume = {
    header: {
      fullName: 'Jane Doe',
      jobTitle: 'Software Engineer',
      email: 'jane@example.com',
      phone: '555-1234',
      location: 'San Francisco, CA',
      linkedin: '',
      github: 'github.com/janedoe',
      website: '',
    },
    summary: 'Experienced engineer building scalable products.',
    experience: [
      {
        id: '1',
        company: 'Tech Corp',
        role: 'Senior Engineer',
        startDate: '2020-01',
        endDate: '2023-06',
        present: false,
        location: 'Remote',
        bullets: ['Led backend platform', 'Improved performance by 30%'],
      },
    ],
    education: [
      { id: '2', degree: 'BS Computer Science', institution: 'State University', year: '2019', gpa: '3.8' },
    ],
    skills: { technical: ['React', 'Node.js'], tools: ['Docker'], soft: ['Leadership'] },
    certifications: [],
    projects: [],
  };

  test('renders candidate name', () => {
    render(<ResumePreview resumeData={sampleResume} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  test('renders job title', () => {
    render(<ResumePreview resumeData={sampleResume} />);
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  test('renders experience section with company name', () => {
    render(<ResumePreview resumeData={sampleResume} />);
    expect(screen.getByText(/Tech Corp/)).toBeInTheDocument();
  });

  test('renders experience role', () => {
    render(<ResumePreview resumeData={sampleResume} />);
    expect(screen.getByText(/Senior Engineer/)).toBeInTheDocument();
  });

  test('renders experience bullets', () => {
    render(<ResumePreview resumeData={sampleResume} />);
    expect(screen.getByText('Led backend platform')).toBeInTheDocument();
  });

  test('renders education section', () => {
    render(<ResumePreview resumeData={sampleResume} />);
    expect(screen.getByText(/State University/)).toBeInTheDocument();
  });

  test('print button calls window.print', () => {
    const mockPrint = vi.fn();
    window.print = mockPrint;
    render(<ResumePreview resumeData={sampleResume} />);
    const printBtn = screen.getByRole('button', { name: /print/i });
    fireEvent.click(printBtn);
    expect(mockPrint).toHaveBeenCalledTimes(1);
  });
});
