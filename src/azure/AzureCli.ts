import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { AzureCliError, mapAzureCliError } from './AzureCliError';

const execFileAsync = promisify(execFile);

export type StorageAccount = { name: string; resourceGroup: string };
export type StorageTable = { name: string };

export class AzureCli {
  constructor(private readonly output: vscode.OutputChannel) {}

  async ensureLogin(): Promise<void> {
    try {
      await this.run<unknown>(['account', 'show']);
    } catch {
      throw new AzureCliError(
        'Azure CLI is not logged in or not installed.',
        'Run `az login` in a terminal and ensure the Azure CLI is on your PATH.'
      );
    }
  }

  async listAccounts(): Promise<StorageAccount[]> {
    const accounts = await this.run<StorageAccount[]>(['storage', 'account', 'list']);
    return Array.isArray(accounts) ? accounts : [];
  }

  async listTables(accountName: string): Promise<StorageTable[]> {
    const tables = await this.runDataPlane<StorageTable[]>([
      'storage', 'table', 'list', '--account-name', accountName
    ]);
    return Array.isArray(tables) ? tables : [];
  }

  async queryEntities(accountName: string, tableName: string): Promise<unknown> {
    return this.runDataPlane<unknown>([
      'storage', 'entity', 'query', '--account-name', accountName, '--table-name', tableName
    ]);
  }

  private run<T>(args: string[]): Promise<T> {
    return this.execute<T>([...args, '--output', 'json']);
  }

  private runDataPlane<T>(args: string[]): Promise<T> {
    return this.execute<T>([...args, '--auth-mode', 'login', '--output', 'json']);
  }

  private async execute<T>(args: string[]): Promise<T> {
    this.output.appendLine(`> az ${args.join(' ')}`);

    let stdout: string;
    try {
      const result = await execFileAsync('az', args, { maxBuffer: 32 * 1024 * 1024 });
      stdout = result.stdout;
      if (result.stderr.trim()) {
        this.output.appendLine(`[stderr] ${result.stderr.trim()}`);
      }
    } catch (error) {
      const cliError = error as { stdout?: string; stderr?: string; message?: string };
      const raw = (cliError.stderr || cliError.stdout || cliError.message || '').toString();
      this.output.appendLine(`[error] ${raw.trim()}`);
      throw mapAzureCliError(raw);
    }

    const trimmed = stdout.trim();
    if (!trimmed) {
      throw new AzureCliError(
        'Azure CLI returned empty output.',
        'Verify your Azure login session and that the resource exists in the active subscription.'
      );
    }

    try {
      return JSON.parse(trimmed) as T;
    } catch {
      throw new AzureCliError(
        'Azure CLI returned a response that is not valid JSON.',
        `First 200 chars: ${trimmed.slice(0, 200)}`
      );
    }
  }
}
