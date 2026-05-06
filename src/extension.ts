import * as vscode from 'vscode';
import { AzureCli } from './azure/AzureCli';
import { QueryTableCommand } from './commands/QueryTableCommand';
import { AzureTableTreeProvider } from './tree/AzureTableTreeProvider';

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel('Azure Table Viewer');
  const azureCli = new AzureCli(output);
  const treeProvider = new AzureTableTreeProvider();
  const queryCommand = new QueryTableCommand(azureCli);

  context.subscriptions.push(
    output,
    vscode.window.registerTreeDataProvider('azureTableViewerView', treeProvider),
    vscode.commands.registerCommand('azureTableViewer.open', () => queryCommand.execute()),
    vscode.commands.registerCommand('azureTableViewer.refresh', () => treeProvider.refresh())
  );

  output.appendLine(`Azure Table Viewer activated (build ${new Date().toISOString()}).`);
}

export function deactivate() {}
