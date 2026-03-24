import { useIDB } from '../../hooks/useIDB';

export const EMPTY_RESUME = {
  header: {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: {
    technical: [],
    tools: [],
    soft: [],
  },
  certifications: [],
  projects: [],
};

export function createExperience(overrides = {}) {
  return {
    id: Date.now().toString(),
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    present: false,
    location: '',
    bullets: [],
    ...overrides,
  };
}

export function createEducation(overrides = {}) {
  return {
    id: Date.now().toString(),
    degree: '',
    institution: '',
    year: '',
    gpa: '',
    ...overrides,
  };
}

export function createCertification(overrides = {}) {
  return {
    id: Date.now().toString(),
    name: '',
    issuer: '',
    year: '',
    ...overrides,
  };
}

export function createProject(overrides = {}) {
  return {
    id: Date.now().toString(),
    name: '',
    description: '',
    url: '',
    tags: [],
    ...overrides,
  };
}

export function useResumeData() {
  const [resumeData, setResumeData, ready] = useIDB('resume-data', EMPTY_RESUME);

  function updateHeader(field, value) {
    setResumeData((prev) => ({
      ...prev,
      header: { ...prev.header, [field]: value },
    }));
  }

  function updateSummary(value) {
    setResumeData((prev) => ({ ...prev, summary: value }));
  }

  // Experience
  function addExperience() {
    setResumeData((prev) => ({
      ...prev,
      experience: [...prev.experience, createExperience()],
    }));
  }

  function updateExperience(id, field, value) {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
  }

  function removeExperience(id) {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((e) => e.id !== id),
    }));
  }

  function addBullet(expId) {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets, ''] } : e
      ),
    }));
  }

  function updateBullet(expId, bulletIndex, value) {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === expId
          ? {
              ...e,
              bullets: e.bullets.map((b, i) => (i === bulletIndex ? value : b)),
            }
          : e
      ),
    }));
  }

  function removeBullet(expId, bulletIndex) {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === expId
          ? { ...e, bullets: e.bullets.filter((_, i) => i !== bulletIndex) }
          : e
      ),
    }));
  }

  // Education
  function addEducation() {
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, createEducation()],
    }));
  }

  function updateEducation(id, field, value) {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
  }

  function removeEducation(id) {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  }

  // Skills
  function addSkill(category, skill) {
    const trimmed = skill.trim();
    if (!trimmed) return;
    setResumeData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...(prev.skills[category] || []), trimmed],
      },
    }));
  }

  function removeSkill(category, index) {
    setResumeData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter((_, i) => i !== index),
      },
    }));
  }

  // Certifications
  function addCertification() {
    setResumeData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, createCertification()],
    }));
  }

  function updateCertification(id, field, value) {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  }

  function removeCertification(id) {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== id),
    }));
  }

  // Projects
  function addProject() {
    setResumeData((prev) => ({
      ...prev,
      projects: [...prev.projects, createProject()],
    }));
  }

  function updateProject(id, field, value) {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  }

  function removeProject(id) {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  }

  function addProjectTag(id, tag) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, tags: [...p.tags, trimmed] } : p
      ),
    }));
  }

  function removeProjectTag(id, tagIndex) {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, tags: p.tags.filter((_, i) => i !== tagIndex) } : p
      ),
    }));
  }

  function loadData(data) {
    setResumeData(data);
  }

  return {
    resumeData,
    ready,
    updateHeader,
    updateSummary,
    addExperience,
    updateExperience,
    removeExperience,
    addBullet,
    updateBullet,
    removeBullet,
    addEducation,
    updateEducation,
    removeEducation,
    addSkill,
    removeSkill,
    addCertification,
    updateCertification,
    removeCertification,
    addProject,
    updateProject,
    removeProject,
    addProjectTag,
    removeProjectTag,
    loadData,
  };
}
