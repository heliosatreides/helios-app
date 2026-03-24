import { useRef, useState } from 'react';
import { parseJSONFile, parseCSVFile } from '../utils/importData';

/**
 * ImportButton — reusable file-import button.
 *
 * Props:
 *   mode: 'json' | 'csv'
 *   onImport(parsedData): called with parsed result
 *   label: button label string
 *   className: optional extra classes
 */
export function ImportButton({ mode = 'json', onImport, label, className = '' }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'importing' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const accept = mode === 'csv' ? '.csv' : '.json';

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm('This will merge with your existing data. Continue?');
    if (!confirmed) {
      // Reset file input
      e.target.value = '';
      return;
    }

    setStatus('importing');
    setErrorMsg('');

    try {
      const data = mode === 'csv' ? await parseCSVFile(file) : await parseJSONFile(file);
      await onImport(data);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Import failed');
    } finally {
      // Reset file input so the same file can be selected again
      e.target.value = '';
    }
  };

  const buttonLabel =
    status === 'importing'
      ? 'Importing...'
      : status === 'success'
      ? '✅ Imported!'
      : label;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        aria-label={label}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={status === 'importing'}
        className={`border border-[#27272a] text-[#e4e4e7] hover:border-amber-400/50 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm transition-colors text-left ${className}`}
      >
        {buttonLabel}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}
