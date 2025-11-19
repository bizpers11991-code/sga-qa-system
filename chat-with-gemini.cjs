#!/usr/bin/env node
/**
 * Gemini CLI Chat Tool
 * Chat with Gemini directly from PowerShell
 * Uses your Gemini API key from .env file
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Load .env file
require('dotenv').config();

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY || API_KEY === 'your_paid_gemini_api_key_here') {
  console.error('❌ Error: GOOGLE_API_KEY not found or not configured in .env file');
  console.error('Please add your Gemini API key to .env file');
  console.error('Get one from: https://aistudio.google.com/apikey');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Initialize chat session
let chatSession;
let conversationHistory = [];

// Load context package automatically
function loadContextPackage() {
  const contextFile = path.join(__dirname, 'GEMINI_CONTEXT_PACKAGE.md');

  if (fs.existsSync(contextFile)) {
    const context = fs.readFileSync(contextFile, 'utf8');
    console.log('📦 Loading context package for Gemini...\n');
    return context;
  }
  return null;
}

// Initialize chat session with context
async function initChat() {
  const context = loadContextPackage();

  const systemMessage = context ? `You are Gemini Pro, an AI deployment assistant helping Dhruv deploy the SGA QA Pack to Microsoft 365. Here's the context:\n\n${context}` :
    'You are Gemini Pro, an AI deployment assistant helping with Microsoft 365 deployment.';

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemMessage
    });

    chatSession = model.startChat({
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
      history: []
    });

    conversationHistory.push({
      role: 'user',
      content: 'Hello! I need help with deploying the SGA QA Pack to Microsoft 365.'
    });

    conversationHistory.push({
      role: 'assistant',
      content: 'Hi Dhruv! I\'ve received the full context from Claude. I understand you need help deploying the SGA QA Pack to Microsoft 365. I can see that:\n\n✅ Most dependencies are installed\n⚠️ Power Platform CLI needs to be fixed\n\nI\'m ready to help! Let\'s start by fixing the Power Platform CLI installation, then we\'ll proceed through all 12 deployment phases.\n\nWhat would you like to tackle first?'
    });

  } catch (error) {
    console.error('❌ Error initializing chat:', error.message);
    process.exit(1);
  }
}

// Send message and get response
async function sendMessage(message) {
  try {
    const result = await chatSession.sendMessage(message);
    const response = result.response;
    const responseText = response.text();

    conversationHistory.push({ role: 'user', content: message });
    conversationHistory.push({ role: 'assistant', content: responseText });

    return responseText;
  } catch (error) {
    console.error('❌ Error communicating with Gemini:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    return null;
  }
}

// Main chat loop
async function startChat() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        🤖 Gemini Pro - M365 Deployment Assistant              ║');
  console.log('║        Chat directly with Gemini from PowerShell               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  await initChat();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\n💬 You: '
  });

  console.log('📝 Type your messages and press Enter. Type "exit", "quit", or press Ctrl+C to end.\n');
  console.log('💡 Commands:');
  console.log('   - Type "load <filename>" to load a file as context');
  console.log('   - Type "help" for more commands');
  console.log('   - Type "clear" to clear screen\n');

  // Show initial message from Gemini
  console.log('🤖 Gemini: Hi Dhruv! I\'ve received the full context from Claude. I understand you need help deploying the SGA QA Pack to Microsoft 365. I can see that:\n');
  console.log('✅ Most dependencies are installed');
  console.log('⚠️ Power Platform CLI needs to be fixed\n');
  console.log('I\'m ready to help! Let\'s start by fixing the Power Platform CLI installation, then we\'ll proceed through all 12 deployment phases.\n');
  console.log('What would you like to tackle first?');

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    // Handle commands
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('\n👋 Goodbye! Good luck with your M365 deployment!');
      rl.close();
      process.exit(0);
    }

    if (input.toLowerCase() === 'help') {
      console.log('\n📖 Available Commands:');
      console.log('   exit, quit     - Exit the chat');
      console.log('   clear          - Clear the screen');
      console.log('   load <file>    - Load a file as context (e.g., load GEMINI_TAKEOVER_PLAN.md)');
      console.log('   save           - Save conversation history to file');
      console.log('   help           - Show this help message\n');
      rl.prompt();
      return;
    }

    if (input.toLowerCase() === 'clear') {
      console.clear();
      console.log('🤖 Gemini Pro - M365 Deployment Assistant\n');
      rl.prompt();
      return;
    }

    if (input.toLowerCase().startsWith('load ')) {
      const filename = input.substring(5).trim();
      const filepath = path.join(__dirname, filename);

      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8');
        console.log(`\n📄 Loading ${filename}...`);

        const response = await sendMessage(`Here's the content of ${filename}:\n\n${content}\n\nPlease review this and let me know you've received it.`);

        if (response) {
          console.log(`\n🤖 Gemini: ${response}`);
        }
      } else {
        console.log(`\n❌ File not found: ${filepath}`);
      }

      rl.prompt();
      return;
    }

    if (input.toLowerCase() === 'save') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `gemini-chat-${timestamp}.txt`;
      const filepath = path.join(__dirname, filename);

      let chatLog = '=== Gemini Chat Log ===\n';
      chatLog += `Date: ${new Date().toISOString()}\n\n`;

      conversationHistory.forEach((msg) => {
        const role = msg.role === 'user' ? 'You' : 'Gemini';
        chatLog += `${role}: ${msg.content}\n\n`;
      });

      fs.writeFileSync(filepath, chatLog);
      console.log(`\n💾 Conversation saved to: ${filename}`);
      rl.prompt();
      return;
    }

    // Send message to Gemini
    console.log('\n🤖 Gemini is thinking...\n');

    const response = await sendMessage(input);

    if (response) {
      console.log(`🤖 Gemini: ${response}`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n👋 Chat ended. Goodbye!');
    process.exit(0);
  });
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});

// Start the chat
startChat().catch(error => {
  console.error('❌ Failed to start chat:', error.message);
  process.exit(1);
});
