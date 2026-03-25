import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResumeVersions({ versions, onSave, onLoad, onDelete }) {
  const [saving, setSaving] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  function handleSave() {
    const name = versionName.trim();
    if (!name) return;
    onSave(name);
    setVersionName('');
    setSaving(false);
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  return (
    <div>
      <div className="mb-6">
        {!saving ? (
          <button
            onClick={() => setSaving(true)}
            className="px-4 py-2 bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors"
          >
            + Save as Version
          </button>
        ) : (
          <div className="bg-secondary border border-amber-500/30 p-4 flex gap-3 items-end max-w-sm">
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">Version Name</label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder='e.g. "SWE Resume"'
                autoFocus
                className="w-full bg-secondary border border-[#3f3f46] px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!versionName.trim()}
              className="px-3 py-2 bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => { setSaving(false); setVersionName(''); }}
              className="px-3 py-2 text-muted-foreground hover:text-foreground text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground/80">
          <p className="text-3xl mb-2">📄</p>
          <p className="text-sm">No saved versions yet.</p>
          <p className="text-xs mt-1">Save your current resume as a named version to switch between them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((v) => (
            <div
              key={v.id}
              className="bg-secondary border border-border p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-foreground font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground/80 mt-0.5">Saved {formatDate(v.savedAt)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onLoad(v.id)}
                  className="px-3 py-1.5 bg-secondary text-foreground border border-amber-500/30 text-xs hover:bg-amber-500/20 transition-colors"
                >
                  Load
                </button>
                <button
                  onClick={() => downloadJSON(v, `resume-${v.name.replace(/\s+/g, '-').toLowerCase()}.json`)}
                  className="px-3 py-1.5 text-muted-foreground hover:text-amber-400 text-xs transition-colors border border-border hover:border-amber-400/30"
                  title="Download as JSON"
                >
                  ⬇️ JSON
                </button>
                <button
                  onClick={() => setDeleteTarget(v.id)}
                  className="px-3 py-1.5 text-muted-foreground/80 hover:text-red-400 text-xs transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { onDelete(deleteTarget); setDeleteTarget(null); }}
        title="Delete version?"
        message="This will permanently delete this saved version."
      />
    </div>
  );
}
