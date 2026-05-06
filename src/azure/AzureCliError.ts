export class AzureCliError extends Error {
  constructor(message: string, hint?: string) {
    super(hint ? `${message}\n\n${hint}` : message);
  }
}

export function mapAzureCliError(raw: string): AzureCliError {
  const message = raw.trim();

  if (/please run ['"]?az login['"]?|run az login|aadstendpointresolutionerror/i.test(message)) {
    return new AzureCliError(
      'Azure CLI is not logged in.',
      'Run `az login` in a terminal, then retry.'
    );
  }

  if (/authorizationpermissionmismatch|authorizationfailed|authorization failed|forbidden|not authorized/i.test(message)) {
    return new AzureCliError(
      'Authorization failed for the Azure Storage data plane.',
      'Your signed-in identity needs the "Storage Table Data Reader" or "Storage Table Data Contributor" RBAC role on the storage account (subscription-level Owner is not sufficient for table data). Assign the role in the Azure Portal under the storage account > Access Control (IAM), then retry.'
    );
  }

  if (/authenticationfailed|invalid_grant|aadsts/i.test(message)) {
    return new AzureCliError(
      'Azure AD authentication failed.',
      'Run `az login` again (your token may have expired) and ensure your tenant allows AAD auth for Table Storage.'
    );
  }

  if (/resourcenotfound|not found/i.test(message)) {
    return new AzureCliError(
      'Azure resource not found.',
      'Verify the active subscription with `az account show` and that the storage account/table exists.'
    );
  }

  if (/'az' is not recognized|command not found: az|enoent/i.test(message)) {
    return new AzureCliError(
      'Azure CLI (`az`) was not found on PATH.',
      'Install it (e.g. `brew install azure-cli`) and restart VS Code.'
    );
  }

  return new AzureCliError(message || 'Unknown Azure CLI error.');
}
