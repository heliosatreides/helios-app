import { useState } from 'react';
import { useResumeData } from './useResumeData';
import { useResumeVersions } from './useResumeVersions';
import { ResumeEdit } from './ResumeEdit';
import { ResumePreview } from './ResumePreview';
import { ResumeVersions } from './ResumeVersions';
import { TabBar, PageHeader } from '../../components/ui';

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
      <PageHeader title="Resume Builder" subtitle="Build, preview, and manage your resume versions" />

      {/* Tabs */}
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

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
