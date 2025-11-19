/**
 * Gemini Orchestrator for M365 Deployment
 *
 * This script uses Gemini API to execute deployment phases while
 * Claude supervises from the background to conserve resources.
 *
 * Created by: Claude (Sonnet 4.5)
 * Date: November 18, 2025
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Logging
const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFile = path.join(LOG_DIR, `gemini-deployment-${new Date().toISOString().split('T')[0]}.log`);

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(logFile, logMessage);
}

/**
 * Call Gemini API with a prompt
 */
async function callGemini(prompt, context = '') {
  log('Calling Gemini API...', 'DEBUG');

  const fullPrompt = context
    ? `${context}\n\n---\n\n${prompt}`
    : prompt;

  const requestBody = {
    contents: [{
      parts: [{
        text: fullPrompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    }
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    log(`Gemini response received (${text.length} chars)`, 'DEBUG');
    return text;
  } catch (error) {
    log(`Error calling Gemini: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Execute PowerShell command and return output
 */
async function executePowerShell(command) {
  log(`Executing PowerShell: ${command.substring(0, 100)}...`, 'DEBUG');

  try {
    const { stdout, stderr } = await execPromise(command, {
      shell: 'powershell.exe',
      timeout: 300000 // 5 minutes timeout
    });

    if (stderr) {
      log(`PowerShell stderr: ${stderr}`, 'WARN');
    }

    log(`PowerShell completed successfully`, 'DEBUG');
    return { success: true, stdout, stderr };
  } catch (error) {
    log(`PowerShell error: ${error.message}`, 'ERROR');
    return { success: false, error: error.message };
  }
}

/**
 * Load deployment context from files
 */
function loadDeploymentContext() {
  const contextFiles = [
    'GEMINI_TAKEOVER_PLAN.md',
    'AZURE_AUTH_COMPLETE.md',
    '.env.azure'
  ];

  let context = `# M365 Deployment Context for Gemini\n\n`;

  for (const file of contextFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      context += `\n## From ${file}:\n\n${content}\n\n---\n\n`;
    }
  }

  return context;
}

/**
 * Phase 1: Power Platform Environment Setup
 */
async function runPhase1() {
  log('=== STARTING PHASE 1: Power Platform Environment Setup ===', 'INFO');

  const context = loadDeploymentContext();

  const prompt = `You are Gemini, helping with M365 deployment of SGA QA Pack application.

CONTEXT:
- Azure authentication is already complete
- User has these credentials available in .env.azure:
  - TENANT_ID: 7026ecbb-b41e-4aa0-9e68-a41eb80634fe
  - CLIENT_ID: fbd9d6a2-67fb-4364-88e0-850b11c75db9
  - SharePoint Site: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
- User is: dhruv@sgagroup.com.au
- Platform: Windows 11, PowerShell

TASK: Guide user through Phase 1 - Creating Power Platform Environment

Provide EXACT PowerShell commands or step-by-step instructions for:

1. Checking if user is logged into Power Platform
2. Creating a new Power Platform environment named "SGA QA Pack - Production"
3. Configuring it with:
   - Type: Production
   - Region: Australia Southeast
   - Dataverse database enabled
   - Currency: AUD
   - Language: English

Format your response as actionable commands the user can run directly.
If any commands need user input, clearly mark them.

Remember: Be concise, provide exact commands, test each step.`;

  const response = await callGemini(prompt, context);

  log('=== GEMINI RESPONSE FOR PHASE 1 ===', 'INFO');
  log(response, 'INFO');

  // Save response to file
  const responseFile = path.join(LOG_DIR, 'phase1-gemini-response.md');
  fs.writeFileSync(responseFile, response);

  log(`Phase 1 response saved to: ${responseFile}`, 'INFO');

  return response;
}

/**
 * Phase 2: Deploy Dataverse Schema
 */
async function runPhase2(environmentUrl) {
  log('=== STARTING PHASE 2: Deploy Dataverse Schema ===', 'INFO');

  const context = loadDeploymentContext();

  const prompt = `You are continuing M365 deployment. Phase 1 is complete.

CONTEXT:
- Power Platform environment created successfully
- Environment URL: ${environmentUrl}
- Azure credentials available in .env.azure
- PowerShell script available at: m365-deployment/scripts/Deploy-DataverseSchema.ps1

TASK: Deploy Dataverse Schema

Provide exact PowerShell commands to:

1. Navigate to the scripts directory
2. Run Deploy-DataverseSchema.ps1 with the environment URL
3. Verify the deployment succeeded
4. List the tables that were created

If the automated script fails, provide instructions for manual table creation.

Be specific and actionable.`;

  const response = await callGemini(prompt, context);

  log('=== GEMINI RESPONSE FOR PHASE 2 ===', 'INFO');
  log(response, 'INFO');

  const responseFile = path.join(LOG_DIR, 'phase2-gemini-response.md');
  fs.writeFileSync(responseFile, response);

  return response;
}

/**
 * Interactive deployment runner
 */
async function interactiveDeployment() {
  log('=== GEMINI-ORCHESTRATED M365 DEPLOYMENT ===', 'INFO');
  log('Claude is supervising in the background to conserve resources', 'INFO');
  log('Gemini will execute all deployment phases', 'INFO');
  log('', 'INFO');

  try {
    // Phase 1
    log('Starting Phase 1...', 'INFO');
    const phase1Response = await runPhase1();

    log('\n\n' + '='.repeat(80), 'INFO');
    log('PHASE 1 COMPLETE', 'INFO');
    log('Review the instructions above and execute them.', 'INFO');
    log('When done, you can call runPhase2() with your environment URL.', 'INFO');
    log('='.repeat(80) + '\n', 'INFO');

    return {
      phase: 1,
      status: 'complete',
      response: phase1Response,
      nextSteps: 'Execute the Phase 1 commands, then run: node scripts/gemini-orchestrator.js --phase 2 --env-url <your-environment-url>'
    };

  } catch (error) {
    log(`DEPLOYMENT ERROR: ${error.message}`, 'ERROR');
    log('Escalating to Claude for assistance...', 'ERROR');
    throw error;
  }
}

/**
 * Ask Gemini a specific question
 */
async function askGemini(question) {
  const context = loadDeploymentContext();
  const response = await callGemini(question, context);
  log('=== GEMINI RESPONSE ===', 'INFO');
  log(response, 'INFO');
  return response;
}

/**
 * Test Gemini API connection
 */
async function testConnection() {
  log('Testing Gemini API connection...', 'INFO');

  try {
    const response = await callGemini('Hello! Please confirm you can access the M365 deployment context. What is the Client ID from the Azure authentication?');
    log('✅ Gemini API connection successful!', 'INFO');
    log(`Response: ${response}`, 'INFO');
    return true;
  } catch (error) {
    log('❌ Gemini API connection failed!', 'ERROR');
    log(`Error: ${error.message}`, 'ERROR');
    return false;
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('❌ GOOGLE_API_KEY not found in .env file!');
    process.exit(1);
  }

  switch (command) {
    case 'test':
      await testConnection();
      break;

    case 'phase1':
      await runPhase1();
      break;

    case 'phase2':
      const envUrl = args.find(arg => arg.startsWith('--env-url='))?.split('=')[1];
      if (!envUrl) {
        console.error('❌ Please provide --env-url=<your-environment-url>');
        process.exit(1);
      }
      await runPhase2(envUrl);
      break;

    case 'ask':
      const question = args.slice(1).join(' ');
      if (!question) {
        console.error('❌ Please provide a question: node gemini-orchestrator.js ask "your question"');
        process.exit(1);
      }
      await askGemini(question);
      break;

    case 'deploy':
      await interactiveDeployment();
      break;

    default:
      console.log(`
Gemini Orchestrator for M365 Deployment

Usage:
  node scripts/gemini-orchestrator.js test                          - Test Gemini API connection
  node scripts/gemini-orchestrator.js phase1                        - Run Phase 1 (Environment Setup)
  node scripts/gemini-orchestrator.js phase2 --env-url=<url>        - Run Phase 2 (Dataverse Schema)
  node scripts/gemini-orchestrator.js ask "your question"           - Ask Gemini a question
  node scripts/gemini-orchestrator.js deploy                        - Start interactive deployment

Examples:
  node scripts/gemini-orchestrator.js test
  node scripts/gemini-orchestrator.js phase1
  node scripts/gemini-orchestrator.js ask "How do I check if Power Platform CLI is installed?"
      `);
      break;
  }
}

// Export functions for programmatic use
export {
  callGemini,
  executePowerShell,
  runPhase1,
  runPhase2,
  askGemini,
  testConnection
};

// Run main function
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'ERROR');
  console.error(error);
  process.exit(1);
});
