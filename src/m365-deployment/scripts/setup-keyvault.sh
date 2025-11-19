#!/bin/bash
# Script to create Azure Key Vault and add secrets
# Usage: ./setup-keyvault.sh <environment> (e.g., ./setup-keyvault.sh prod)

ENV=$1

if [ -z "$ENV" ]; then
  echo "Error: Environment not specified"
  echo "Usage: ./setup-keyvault.sh <environment>"
  exit 1
fi

RESOURCE_GROUP="sga-qapack-$ENV-rg"
KEYVAULT_NAME="sga-qapack-kv-$ENV"
LOCATION="australiaeast"
FUNCTION_APP_NAME="sga-qapack-func-$ENV"

echo "Creating Key Vault: $KEYVAULT_NAME"

# Create Key Vault
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-soft-delete true \
  --enable-purge-protection true \
  --sku standard

# Enable Function App system-assigned managed identity
echo "Enabling managed identity on Function App"
az functionapp identity assign \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP

# Get the managed identity principal ID
PRINCIPAL_ID=$(az functionapp identity show \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId \
  --output tsv)

# Grant Function App access to Key Vault
echo "Granting Key Vault access to Function App"
az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list

# Add secrets (will prompt for values)
echo "Adding secrets to Key Vault"
echo "Enter Dataverse URL:"
read DATAVERSE_URL
az keyvault secret set --vault-name $KEYVAULT_NAME --name "DATAVERSE-URL" --value "$DATAVERSE_URL"

echo "Enter Dataverse Client ID:"
read DATAVERSE_CLIENT_ID
az keyvault secret set --vault-name $KEYVAULT_NAME --name "DATAVERSE-CLIENT-ID" --value "$DATAVERSE_CLIENT_ID"

echo "Enter Dataverse Client Secret:"
read -s DATAVERSE_CLIENT_SECRET
az keyvault secret set --vault-name $KEYVAULT_NAME --name "DATAVERSE-CLIENT-SECRET" --value "$DATAVERSE_CLIENT_SECRET"

echo "Enter Azure OpenAI Endpoint:"
read AZURE_OPENAI_ENDPOINT
az keyvault secret set --vault-name $KEYVAULT_NAME --name "AZURE-OPENAI-ENDPOINT" --value "$AZURE_OPENAI_ENDPOINT"

echo "Enter Azure OpenAI Key:"
read -s AZURE_OPENAI_KEY
az keyvault secret set --vault-name $KEYVAULT_NAME --name "AZURE-OPENAI-KEY" --value "$AZURE_OPENAI_KEY"

echo "✅ Key Vault setup complete!"
echo "Update Function App setting KEY_VAULT_NAME=$KEYVAULT_NAME"

# Update Function App configuration
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings KEY_VAULT_NAME=$KEYVAULT_NAME