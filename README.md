# Azure Table Storage Viewer

A minimal VS Code extension that lists Azure Storage accounts, picks a table, and renders its entities as a sortable table or raw JSON.

## Requirements

- VS Code `1.80.0` or newer
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) on `PATH`
- An active `az login` session
- One of the following data-plane RBAC roles on the storage account:
  - `Storage Table Data Reader`
  - `Storage Table Data Contributor`

> Subscription-level `Owner` is **not** sufficient for table data. RBAC for the data plane is granted per storage account under *Access Control (IAM)*.

## Usage

1. Open the **AZ Tables** view from the Activity Bar.
2. Click **Query Azure Table** (or run *Azure Table Storage Viewer: Open* from the Command Palette).
3. Pick a storage account, then a table.
4. Results open in a panel with a toggle between **Table** and **Raw JSON** view.

## How it works

The extension shells out to `az` (no Azure SDK dependency):

| Operation | Plane | Auth |
| --- | --- | --- |
| `az account show` | management | active `az login` |
| `az storage account list` | management | active `az login` |
| `az storage table list` | data | `--auth-mode login` (Azure AD) |
| `az storage entity query` | data | `--auth-mode login` (Azure AD) |

No account keys, connection strings, or SAS tokens are used or fetched.

## Troubleshooting

Every CLI invocation is logged to the **Azure Table Viewer** Output channel (`View → Output`, dropdown top-right). Each line is prefixed with `>` for the executed command, `[stderr]` for warnings, `[error]` for failures.

Common errors and what they mean:

| Error | Likely cause |
| --- | --- |
| *Azure CLI is not logged in or not installed.* | Run `az login`, verify `az --version` works. |
| *Authorization failed for the Azure Storage data plane.* | Missing `Storage Table Data Reader/Contributor` role on the account. |
| *Azure AD authentication failed.* | Token expired — run `az login` again. |
| *Azure CLI returned empty output.* | Resource exists but is empty, or wrong subscription is active. Check `az account show`. |

## Development

```bash
npm install
npm run typecheck         # tsc --noEmit
npm run compile           # esbuild bundle (with sourcemap, no minify)
npm run watch             # esbuild --watch
npm run bundle:prod       # esbuild bundle (minified)
npm run package           # produces .vsix (runs typecheck + bundle:prod)
```

To test a local build:

```bash
code --install-extension azure-table-storage-viewer-0.0.1.vsix --force
```

Then run *Developer: Reload Window*.

### Project structure

```
src/
├── extension.ts                    entry point, DI wiring
├── azure/
│   ├── AzureCli.ts                 typed wrapper around `az`
│   └── AzureCliError.ts            error class + stderr → user-message mapping
├── tree/
│   └── AzureTableTreeProvider.ts   Activity Bar tree
├── commands/
│   └── QueryTableCommand.ts        pick account → pick table → query → render
└── webview/
    └── TableWebview.ts             panel with table/JSON toggle (CSP nonce-protected)
```

The bundled output is a single `out/extension.js` produced by `esbuild`.

## License

MIT — see [LICENSE](./LICENSE).
