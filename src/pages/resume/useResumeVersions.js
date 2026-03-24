import { useIDB } from '../../hooks/useIDB';

export function useResumeVersions() {
  const [versions, setVersions, ready] = useIDB('resume-versions', []);

  function saveVersion(name, data) {
    const version = {
      id: Date.now().toString(),
      name: name.trim(),
      savedAt: new Date().toISOString(),
      data,
    };
    setVersions((prev) => [...prev, version]);
    return version;
  }

  function deleteVersion(id) {
    setVersions((prev) => prev.filter((v) => v.id !== id));
  }

  function getVersion(id) {
    return versions.find((v) => v.id === id) || null;
  }

  return {
    versions,
    ready,
    saveVersion,
    deleteVersion,
    getVersion,
  };
}
