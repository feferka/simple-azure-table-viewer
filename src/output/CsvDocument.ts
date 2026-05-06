import * as vscode from 'vscode';
import { buildTableModel, stringifyCell, TableModel } from '../model/TableModel';
import { ResultPresenter } from './ResultPresenter';

export class CsvDocument implements ResultPresenter {
  private readonly model: TableModel;

  constructor(
    private readonly accountName: string,
    private readonly tableName: string,
    raw: unknown
  ) {
    this.model = buildTableModel(raw);
  }

  get isEmpty(): boolean {
    return this.model.rows.length === 0;
  }

  async show(): Promise<void> {
    const fileName = `${sanitizeFileName(this.accountName)}-${sanitizeFileName(this.tableName)}.csv`;
    const uri = vscode.Uri.parse(`untitled:${fileName}`);
    const doc = await vscode.workspace.openTextDocument(uri);

    const edit = new vscode.WorkspaceEdit();
    edit.insert(uri, new vscode.Position(0, 0), this.toCsv());
    await vscode.workspace.applyEdit(edit);

    await vscode.languages.setTextDocumentLanguage(doc, 'csv');
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  private toCsv(): string {
    const header = this.model.columns.map(escapeCsv).join(',');
    const rows = this.model.rows.map(row =>
      this.model.columns.map(col => escapeCsv(stringifyCell(row[col]))).join(',')
    );
    return [header, ...rows].join('\n');
  }
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, '_');
}
