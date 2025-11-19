#!/bin/bash

# Setup script for SGA QA Pack AI Team Environment
# Grok + Gemini + Claude Collaboration

echo "🤖 SGA QA Pack AI Team Setup"
echo "================================"
echo ""

# Check if Python 3.8+ is available
echo "Checking Python version..."
python3 --version || {
    echo "❌ Python 3 is required but not found."
    echo "Please install Python 3.8 or higher from: https://www.python.org/downloads/"
    exit 1
}

PYTHON_VERSION=$(python3 --version 2>&1 | grep -oP '\d+\.\d+' | head -1)
REQUIRED_VERSION="3.8"

if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)"; then
    echo "❌ Python version $PYTHON_VERSION is too old. Please install Python 3.8 or higher."
    exit 1
fi

echo "✓ Python $PYTHON_VERSION detected"
echo ""

# Create virtual environment
echo "Creating virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists. Removing old one..."
    rm -rf venv
fi

python3 -m venv venv
echo "✓ Virtual environment created"
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip --quiet
echo "✓ pip upgraded"
echo ""

# Install dependencies
echo "Installing required packages..."
echo "  • google-generativeai (Gemini API)"
echo "  • openai (Grok API - compatible mode)"
echo "  • python-dotenv (environment variables)"
echo "  • requests (HTTP requests)"
echo "  • rich (beautiful terminal output)"
echo ""

pip install -r requirements.txt --quiet

if [ $? -eq 0 ]; then
    echo "✓ All packages installed successfully"
else
    echo "❌ Package installation failed. Please check errors above."
    exit 1
fi

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""

# Check for .env file
if [ -f ".env" ]; then
    echo "✓ Found existing .env file with API keys"
else
    echo "⚠️  No .env file found. Creating template..."
    cat > .env << EOF
# SGA QA Pack AI Team - API Keys
# Replace these with your actual API keys

# Gemini API Key (Get from: https://aistudio.google.com/apikey)
GOOGLE_API_KEY=your_gemini_api_key_here

# Grok API Key via opencode.ai (Get from: https://opencode.ai/auth)
# NOTE: Free access to Grok Code Fast 1 available!
OPENCODE_API_KEY=your_opencode_api_key_here
EOF
    echo "✓ Created .env template. Please edit and add your API keys:"
    echo "  nano .env"
fi

echo ""
echo "📋 Next Steps:"
echo "================================"
echo ""
echo "1. Get your API keys:"
echo "   • Gemini: https://aistudio.google.com/apikey"
echo "   • Grok (via opencode.ai): https://opencode.ai/auth"
echo "     (FREE access to Grok Code Fast 1!)"
echo ""
echo "2. Set your API keys (choose one method):"
echo ""
echo "   Method A - Environment Variables (temporary):"
echo "   export GOOGLE_API_KEY='your_gemini_api_key'"
echo "   export OPENCODE_API_KEY='your_opencode_api_key'"
echo ""
echo "   Method B - Edit .env file (permanent):"
echo "   nano .env"
echo "   (Replace the placeholder keys with your actual keys)"
echo ""
echo "3. Activate environment (every time you start):"
echo "   source venv/bin/activate"
echo ""
echo "4. Run the AI team:"
echo "   python run_team.py"
echo ""
echo "5. Read the full setup guide:"
echo "   cat readme/AI_TEAM_SETUP_GUIDE.md"
echo ""
echo "================================"
echo "🚀 Ready to start your AI team collaboration!"
echo "================================"
echo ""

# Create output directories
mkdir -p ai_team_output/session_logs
mkdir -p ai_team_output/code_changes
mkdir -p ai_team_output/review_reports

echo "✓ Created output directories"
echo ""

# Test if instructions.md exists
if [ -f "instructions.md" ]; then
    echo "✓ Found instructions.md for AI team tasks"
else
    echo "⚠️  instructions.md not found - it will be needed to run the team"
fi

echo ""
echo "For troubleshooting, see: readme/AI_TEAM_SETUP_GUIDE.md"
echo ""