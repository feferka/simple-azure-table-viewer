export type TableModel = {
  columns: string[];
  rows: Array<Record<string, unknown>>;
};

export function buildTableModel(raw: unknown): TableModel {
  const rows = extractRows(raw);
  const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
  return { columns, rows };
}

function extractRows(raw: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) {
    return raw as Array<Record<string, unknown>>;
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)) {
    return (raw as { items: Array<Record<string, unknown>> }).items;
  }
  return [];
}

export function stringifyCell(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
