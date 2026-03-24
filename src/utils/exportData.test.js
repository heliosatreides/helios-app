import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportAllAsJSON, exportAsCSV } from './exportData';

describe('exportData utilities', () => {
  let clickMock;
  let createObjectURLMock;
  let revokeObjectURLMock;
  let createElementMock;
  let originalCreateElement;

  beforeEach(() => {
    clickMock = vi.fn();
    createObjectURLMock = vi.fn(() => 'blob:mock-url');
    revokeObjectURLMock = vi.fn();

    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    originalCreateElement = document.createElement.bind(document);
    createElementMock = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickMock };
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportAllAsJSON', () => {
    it('creates a Blob with the correct JSON structure', () => {
      const data = {
        exportedAt: '2024-01-01T00:00:00.000Z',
        trips: [],
        finance: { accounts: [], transactions: [], budgets: [] },
        investments: { portfolio: [], watchlist: [], strategyNotes: '' },
        sports: { favorites: [] },
      };

      exportAllAsJSON(data);

      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      const blob = createObjectURLMock.mock.calls[0][0];
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('triggers a download click', () => {
      exportAllAsJSON({ exportedAt: '2024-01-01' });
      expect(clickMock).toHaveBeenCalledTimes(1);
    });

    it('sets correct filename with date stamp', () => {
      const mockDate = '2024-06-15';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${mockDate}T12:00:00.000Z`);

      const anchor = { href: '', download: '', click: clickMock };
      createElementMock.mockImplementation((tag) => {
        if (tag === 'a') return anchor;
        return originalCreateElement(tag);
      });

      exportAllAsJSON({ exportedAt: 'now' });

      expect(anchor.download).toBe(`helios-export-${mockDate}.json`);
    });

    it('produces valid JSON that can be re-parsed', async () => {
      let capturedBlob = null;
      createObjectURLMock.mockImplementation((blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      });

      const data = { exportedAt: 'now', trips: [{ name: 'Paris trip' }] };
      exportAllAsJSON(data);

      const text = await capturedBlob.text();
      const parsed = JSON.parse(text);
      expect(parsed.exportedAt).toBe('now');
      expect(parsed.trips[0].name).toBe('Paris trip');
    });

    it('revokes the object URL after download', () => {
      exportAllAsJSON({});
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('exportAsCSV', () => {
    it('creates a CSV with correct headers', async () => {
      let capturedBlob = null;
      createObjectURLMock.mockImplementation((blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      });

      const rows = [{ date: '2024-01-01', amount: 100, description: 'Coffee' }];
      exportAsCSV(rows, 'test.csv');

      const text = await capturedBlob.text();
      const lines = text.split('\n');
      expect(lines[0]).toBe('date,amount,description');
    });

    it('escapes double quotes in values', async () => {
      let capturedBlob = null;
      createObjectURLMock.mockImplementation((blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      });

      const rows = [{ name: 'He said "hello"', value: 42 }];
      exportAsCSV(rows, 'test.csv');

      const text = await capturedBlob.text();
      expect(text).toContain('"He said ""hello"""');
    });

    it('handles empty arrays gracefully (no download)', () => {
      exportAsCSV([], 'empty.csv');
      expect(createObjectURLMock).not.toHaveBeenCalled();
      expect(clickMock).not.toHaveBeenCalled();
    });

    it('creates correct CSV row count', async () => {
      let capturedBlob = null;
      createObjectURLMock.mockImplementation((blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      });

      const rows = [
        { a: '1', b: '2' },
        { a: '3', b: '4' },
        { a: '5', b: '6' },
      ];
      exportAsCSV(rows, 'test.csv');

      const text = await capturedBlob.text();
      const lines = text.split('\n');
      // header + 3 data rows
      expect(lines).toHaveLength(4);
    });

    it('handles null/undefined values by converting to empty string', async () => {
      let capturedBlob = null;
      createObjectURLMock.mockImplementation((blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      });

      const rows = [{ a: null, b: undefined, c: 'valid' }];
      exportAsCSV(rows, 'test.csv');

      const text = await capturedBlob.text();
      const dataLine = text.split('\n')[1];
      expect(dataLine).toBe('"","","valid"');
    });

    it('sets the correct filename', () => {
      const anchor = { href: '', download: '', click: clickMock };
      createElementMock.mockImplementation((tag) => {
        if (tag === 'a') return anchor;
        return originalCreateElement(tag);
      });

      exportAsCSV([{ col: 'val' }], 'transactions-2024.csv');
      expect(anchor.download).toBe('transactions-2024.csv');
    });

    it('sets blob type to text/csv', () => {
      exportAsCSV([{ col: 'val' }], 'test.csv');
      const blob = createObjectURLMock.mock.calls[0][0];
      expect(blob.type).toBe('text/csv');
    });
  });

  describe('dateStamp (via exportAllAsJSON)', () => {
    it('date stamp format is YYYY-MM-DD', () => {
      const anchor = { href: '', download: '', click: clickMock };
      createElementMock.mockImplementation((tag) => {
        if (tag === 'a') return anchor;
        return originalCreateElement(tag);
      });

      exportAllAsJSON({});

      // Extract date from filename: helios-export-YYYY-MM-DD.json
      const match = anchor.download.match(/helios-export-(\d{4}-\d{2}-\d{2})\.json/);
      expect(match).not.toBeNull();
      expect(match[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
