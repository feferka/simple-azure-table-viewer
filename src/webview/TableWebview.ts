import { randomBytes } from 'crypto';
import * as vscode from 'vscode';

type TableModel = { columns: string[]; rows: Array<Record<string, unknown>> };

export class TableWebview {
  private readonly model: TableModel;

  constructor(
    private readonly accountName: string,
    private readonly tableName: string,
    private readonly raw: unknown
  ) {
    this.model = TableWebview.buildModel(raw);
  }

  get isEmpty(): boolean {
    return this.model.rows.length === 0;
  }

  show(): void {
    const panel = vscode.window.createWebviewPanel(
      'azureTableViewerTable',
      `Azure Table ${this.tableName}`,
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    panel.webview.html = this.render();
  }

  private render(): string {
    const nonce = randomBytes(16).toString('base64');
    const headerHtml = this.model.columns.map(col => `<th>${escapeHtml(col)}</th>`).join('');
    const rowsHtml = this.model.rows
      .map(row => `<tr>${this.model.columns.map(col => `<td>${escapeHtml(stringifyValue(row[col]))}</td>`).join('')}</tr>`)
      .join('');
    const jsonPayload = escapeHtml(JSON.stringify(this.raw, null, 2));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Azure Table ${escapeHtml(this.tableName)}</title>
  <style>
    body { font-family: var(--vscode-editor-font-family); color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); margin: 0; padding: 16px; }
    h1 { margin-top: 0; }
    button { margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid var(--vscode-editorWidget-border); padding: 8px; text-align: left; vertical-align: top; }
    th { background: var(--vscode-editorWidget-background); }
    pre { background: var(--vscode-editor-background); border: 1px solid var(--vscode-editorWidget-border); padding: 12px; overflow: auto; }
  </style>
</head>
<body>
  <h1>${escapeHtml(this.accountName)} / ${escapeHtml(this.tableName)}</h1>
  <button id="toggleJson">Show Raw JSON</button>
  <div id="tableView">
    <table>
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>
  <pre id="jsonView" style="display:none; white-space: pre-wrap;">${jsonPayload}</pre>
  <script nonce="${nonce}">
    const toggle = document.getElementById('toggleJson');
    const tableView = document.getElementById('tableView');
    const jsonView = document.getElementById('jsonView');
    toggle.addEventListener('click', () => {
      const showingJson = jsonView.style.display !== 'none';
      jsonView.style.display = showingJson ? 'none' : 'block';
      tableView.style.display = showingJson ? 'block' : 'none';
      toggle.textContent = showingJson ? 'Show Raw JSON' : 'Show Table';
    });
  </script>
</body>
</html>`;
  }

  private static buildModel(raw: unknown): TableModel {
    const rows = TableWebview.extractRows(raw);
    const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
    return { columns, rows };
  }

  private static extractRows(raw: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(raw)) {
      return raw as Array<Record<string, unknown>>;
    }
    if (raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)) {
      return (raw as { items: Array<Record<string, unknown>> }).items;
    }
    return [];
  }
}

function escapeHtml(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stringifyValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
