import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

let secretClient: SecretClient | null = null;

interface AppConfig {
  dataverseUrl: string;
  dataverseClientId: string;
  dataverseClientSecret: string;
  azureOpenAIEndpoint: string;
  azureOpenAIKey: string;
}

/**
 * Initializes connection to Azure Key Vault
 * Uses Managed Identity in production, environment variables in development
 */
export async function initializeConfig(): Promise<AppConfig> {
  const keyVaultName = process.env.KEY_VAULT_NAME;

  if (!keyVaultName) {
    throw new Error(
      'FATAL: KEY_VAULT_NAME environment variable is not set.\n' +
      'Configure this in Azure Function App settings.'
    );
  }

  const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;

  // Use DefaultAzureCredential which works both locally (with Azure CLI) and in Azure (with Managed Identity)
  const credential = new DefaultAzureCredential();
  secretClient = new SecretClient(keyVaultUrl, credential);

  // Load all required secrets
  try {
    const [
      dataverseUrl,
      dataverseClientId,
      dataverseClientSecret,
      azureOpenAIEndpoint,
      azureOpenAIKey
    ] = await Promise.all([
      getSecret('DATAVERSE-URL'),
      getSecret('DATAVERSE-CLIENT-ID'),
      getSecret('DATAVERSE-CLIENT-SECRET'),
      getSecret('AZURE-OPENAI-ENDPOINT'),
      getSecret('AZURE-OPENAI-KEY')
    ]);

    // Validate all secrets were loaded
    const missing = [];
    if (!dataverseUrl) missing.push('DATAVERSE-URL');
    if (!dataverseClientId) missing.push('DATAVERSE-CLIENT-ID');
    if (!dataverseClientSecret) missing.push('DATAVERSE-CLIENT-SECRET');
    if (!azureOpenAIEndpoint) missing.push('AZURE-OPENAI-ENDPOINT');
    if (!azureOpenAIKey) missing.push('AZURE-OPENAI-KEY');

    if (missing.length > 0) {
      throw new Error(`FATAL: Missing required secrets in Key Vault: ${missing.join(', ')}`);
    }

    // Validate URL format
    new URL(dataverseUrl!);  // Throws if invalid
    new URL(azureOpenAIEndpoint!);  // Throws if invalid

    return {
      dataverseUrl: dataverseUrl!,
      dataverseClientId: dataverseClientId!,
      dataverseClientSecret: dataverseClientSecret!,
      azureOpenAIEndpoint: azureOpenAIEndpoint!,
      azureOpenAIKey: azureOpenAIKey!
    };

  } catch (error: any) {
    throw new Error(
      `FATAL: Failed to load configuration from Key Vault.\n` +
      `Error: ${error.message}\n` +
      `Ensure the Function App has 'Get' permission on Key Vault secrets.`
    );
  }
}

/**
 * Retrieves a secret from Azure Key Vault
 */
async function getSecret(secretName: string): Promise<string | undefined> {
  if (!secretClient) {
    throw new Error('Secret client not initialized. Call initializeConfig() first.');
  }

  try {
    const secret = await secretClient.getSecret(secretName);
    return secret.value;
  } catch (error: any) {
    console.error(`Failed to retrieve secret '${secretName}':`, error.message);
    return undefined;
  }
}