import * as vscode from 'vscode';
import { AzureCli, StorageAccount, StorageTable } from '../azure/AzureCli';
import { TableWebview } from '../webview/TableWebview';

export class QueryTableCommand {
  constructor(private readonly azureCli: AzureCli) {}

  async execute(): Promise<void> {
    try {
      await this.azureCli.ensureLogin();

      const account = await this.pickAccount();
      if (!account) {
        return;
      }

      const table = await this.pickTable(account.name);
      if (!table) {
        return;
      }

      const result = await this.azureCli.queryEntities(account.name, table.name);
      const webview = new TableWebview(account.name, table.name, result);

      if (webview.isEmpty) {
        vscode.window.showInformationMessage(`No entities returned for table ${table.name}.`);
        return;
      }

      webview.show();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Azure Table Storage Viewer failed: ${message}`);
    }
  }

  private async pickAccount(): Promise<StorageAccount | undefined> {
    const accounts = await this.azureCli.listAccounts();
    if (accounts.length === 0) {
      vscode.window.showWarningMessage('No storage accounts found in the current Azure session.');
      return undefined;
    }

    const selection = await vscode.window.showQuickPick(
      accounts.map(account => ({ label: account.name, description: account.resourceGroup, account })),
      { placeHolder: 'Select an Azure Storage account' }
    );
    return selection?.account;
  }

  private async pickTable(accountName: string): Promise<StorageTable | undefined> {
    const tables = await this.azureCli.listTables(accountName);
    if (tables.length === 0) {
      vscode.window.showWarningMessage(`No tables found for storage account ${accountName}.`);
      return undefined;
    }

    const selection = await vscode.window.showQuickPick(
      tables.map(table => ({ label: table.name, table })),
      { placeHolder: 'Select a table to query' }
    );
    return selection?.table;
  }
}
