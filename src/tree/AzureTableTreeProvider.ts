import * as vscode from 'vscode';

export class AzureTableTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.ProviderResult<vscode.TreeItem[]> {
    const action = new vscode.TreeItem('Query Azure Table', vscode.TreeItemCollapsibleState.None);
    action.command = { command: 'azureTableViewer.open', title: 'Query Azure Table' };
    action.tooltip = 'Select a storage account and table to load JSON output.';
    return [action];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}
