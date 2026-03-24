// Parse a JSON file → object
export function parseJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result));
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Parse a CSV file → array of objects (first row is headers)
export function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const lines = e.target.result.split('\n').filter((l) => l.trim());
        if (lines.length < 2) {
          resolve([]);
          return;
        }
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        const rows = lines.slice(1).map((line) => {
          const values = line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
          return headers.reduce((obj, h, i) => {
            obj[h] = (values[i] || '').replace(/^"|"$/g, '');
            return obj;
          }, {});
        });
        resolve(rows);
      } catch {
        reject(new Error('Invalid CSV file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Generate a simple unique ID
export function generateImportId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Merge incoming items into existing items, skipping duplicates by `id`.
 * Items without an `id` get a new generated id.
 * Returns { merged: Array, imported: number, skipped: number }
 */
export function mergeById(existing, incoming) {
  const existingIds = new Set(existing.map((item) => item.id).filter(Boolean));
  let imported = 0;
  let skipped = 0;
  const newItems = [];

  for (const item of incoming) {
    if (!item.id) {
      // No id — assign a new one and always add
      newItems.push({ ...item, id: generateImportId() });
      imported++;
    } else if (existingIds.has(item.id)) {
      skipped++;
    } else {
      newItems.push(item);
      imported++;
    }
  }

  return {
    merged: [...existing, ...newItems],
    imported,
    skipped,
  };
}

/**
 * Merge incoming investment holdings by ticker (case-insensitive).
 * Items without a ticker get a new id and are added.
 * Returns { merged: Array, imported: number, skipped: number }
 */
export function mergeByTicker(existing, incoming) {
  const existingTickers = new Set(
    existing.map((item) => (item.ticker || '').toUpperCase()).filter(Boolean)
  );
  let imported = 0;
  let skipped = 0;
  const newItems = [];

  for (const item of incoming) {
    const ticker = (item.ticker || '').toUpperCase();
    if (!ticker) {
      newItems.push({ ...item, id: item.id || generateImportId() });
      imported++;
    } else if (existingTickers.has(ticker)) {
      skipped++;
    } else {
      newItems.push({ ...item, id: item.id || generateImportId() });
      imported++;
      existingTickers.add(ticker);
    }
  }

  return {
    merged: [...existing, ...newItems],
    imported,
    skipped,
  };
}

/**
 * Map a CSV row (with string values) to a trip object.
 * Generates a new id for each row.
 */
export function csvRowToTrip(row) {
  return {
    id: generateImportId(),
    name: row.name || row.Name || '',
    destination: row.destination || row.Destination || '',
    startDate: row.startDate || row.start_date || row['Start Date'] || '',
    endDate: row.endDate || row.end_date || row['End Date'] || '',
    budget: parseFloat(row.budget || row.Budget || '0') || 0,
    status: row.status || row.Status || 'Planning',
    itinerary: [],
    expenses: [],
    notes: '',
  };
}

/**
 * Map a CSV row to a transaction object.
 * Generates a new id.
 */
export function csvRowToTransaction(row) {
  return {
    id: generateImportId(),
    date: row.date || row.Date || '',
    description: row.description || row.Description || '',
    amount: parseFloat(row.amount || row.Amount || '0') || 0,
    type: row.type || row.Type || 'expense',
    category: row.category || row.Category || 'Other',
    account: row.account || row.Account || '',
    accountId: row.accountId || row.account_id || '',
  };
}

/**
 * Map a CSV row to a portfolio holding object.
 * Generates a new id.
 */
export function csvRowToHolding(row) {
  return {
    id: generateImportId(),
    ticker: (row.ticker || row.Ticker || '').toUpperCase(),
    name: row.name || row.Name || '',
    assetClass: row.assetClass || row.asset_class || row['Asset Class'] || 'Stocks',
    shares: parseFloat(row.shares || row.Shares || '0') || 0,
    costBasis: parseFloat(row.costBasis || row.cost_basis || row['Cost Basis'] || '0') || 0,
    currentPrice: parseFloat(row.currentPrice || row.current_price || row['Current Price'] || '0') || 0,
  };
}
