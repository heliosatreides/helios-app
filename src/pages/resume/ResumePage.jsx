import { useState } from 'react';
import { useResumeData } from './useResumeData';
import { useResumeVersions } from './useResumeVersions';
import { ResumeEdit } from './ResumeEdit';
import { ResumePreview } from './ResumePreview';
import { ResumeVersions } from './ResumeVersions';

const TABS = ['Edit', 'Preview', 'Versions'];

export function ResumePage() {
  const [activeTab, setActiveTab] = useState('Edit');

  const {
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
  } = useResumeData();

  const { versions, saveVersion, deleteVersion, getVersion } = useResumeVersions();

  const actions = {
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
  };

  function handleSaveVersion(name) {
    saveVersion(name, resumeData);
  }

  function handleLoadVersion(id) {
    const v = getVersion(id);
    if (v) {
      loadData(v.data);
      setActiveTab('Edit');
    }
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Loading resume data…</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Resume Builder</h1>
        <p className="text-muted-foreground text-sm mt-1">Build, preview, and manage your resume versions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-secondary border border-border p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-amber-500 text-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Edit' && <ResumeEdit resumeData={resumeData} actions={actions} />}
      {activeTab === 'Preview' && <ResumePreview resumeData={resumeData} />}
      {activeTab === 'Versions' && (
        <ResumeVersions
          versions={versions}
          onSave={handleSaveVersion}
          onLoad={handleLoadVersion}
          onDelete={deleteVersion}
        />
      )}
    </div>
  );
}
