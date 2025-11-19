#!/bin/bash
# deploy-azure-functions.sh
# Deploys all Azure Functions for backend logic

set -e

# Configuration
RESOURCE_GROUP="sga-qa-rg"
LOCATION="australiaeast"
FUNCTION_APP_NAME="sga-qa-functions"
STORAGE_ACCOUNT_NAME="sgaqafunctions"

# Replace these placeholders with your actual values
AZURE_TENANT_ID="YOUR_AZURE_TENANT_ID"
AZURE_CLIENT_ID="YOUR_AZURE_CLIENT_ID"
AZURE_CLIENT_SECRET="YOUR_AZURE_CLIENT_SECRET"
DATAVERSE_URL="YOUR_DATAVERSE_URL" # This will be available after running setup-dataverse-environment.ps1
AZURE_OPENAI_ENDPOINT="YOUR_AZURE_OPENAI_ENDPOINT"
AZURE_OPENAI_KEY="YOUR_AZURE_OPENAI_KEY"


echo "🚀 Deploying Azure Functions..."

# Login to Azure
az login

# Create resource group
echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create storage account
echo "Creating storage account..."
az storage account create \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Create Function App
echo "Creating Function App..."
az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --name $FUNCTION_APP_NAME \
  --storage-account $STORAGE_ACCOUNT_NAME \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --consumption-plan-location $LOCATION \
  --os-type Linux

# Configure application settings
echo "Configuring application settings..."
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AZURE_TENANT_ID=$AZURE_TENANT_ID \
    AZURE_CLIENT_ID=$AZURE_CLIENT_ID \
    AZURE_CLIENT_SECRET=$AZURE_CLIENT_SECRET \
    DATAVERSE_URL=$DATAVERSE_URL \
    AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT \
    AZURE_OPENAI_KEY=$AZURE_OPENAI_KEY \
    AZURE_OPENAI_DEPLOYMENT="gpt-4"

# Enable Application Insights
echo "Enabling Application Insights..."
az monitor app-insights component create \
  --app $FUNCTION_APP_NAME \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP

# Build and deploy functions
echo "Building TypeScript functions..."
# Assuming the functions are in a directory named 'sga-qa-functions' at the root
# You may need to adjust this path
cd ../azure-functions 
npm install
npm run build

echo "Deploying functions..."
func azure functionapp publish $FUNCTION_APP_NAME

echo "✅ Azure Functions deployed successfully!"
echo "Function App URL: https://$FUNCTION_APP_NAME.azurewebsites.net"
