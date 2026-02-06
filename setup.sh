#!/bin/bash

# Quick Setup Script for Exit Blueprint
# This script helps you get started quickly

echo "========================================"
echo "   Exit Blueprint Quick Setup"
echo "========================================"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✓ .env.local already exists"
    echo ""
    read -p "Do you want to reconfigure? (y/n): " reconfigure
    if [ "$reconfigure" != "y" ]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Copy example file
cp .env.local.example .env.local
echo "✓ Created .env.local from example"
echo ""

# Ask for Supabase credentials
echo "Step 1: Supabase Configuration"
echo "-------------------------------"
echo "Get these from: https://app.supabase.com/project/_/settings/api"
echo ""
read -p "Enter your Supabase URL: " supabase_url
read -p "Enter your Supabase Anon Key: " supabase_key

# Update .env.local with Supabase credentials
sed -i "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$supabase_url|" .env.local
sed -i "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$supabase_key|" .env.local

echo ""
echo "Step 2: Choose AI Provider"
echo "--------------------------"
echo "1) OpenAI (Paid, High Quality)"
echo "2) Ollama (FREE, Self-Hosted)"
echo ""
read -p "Enter choice (1 or 2): " ai_choice

if [ "$ai_choice" = "1" ]; then
    echo ""
    echo "OpenAI Setup"
    echo "Get your API key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Enter your OpenAI API Key: " openai_key
    sed -i "s|VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=$openai_key|" .env.local
    echo "✓ OpenAI configured"
    
elif [ "$ai_choice" = "2" ]; then
    echo ""
    echo "Ollama Setup"
    echo "Installing Ollama..."
    
    # Check if Ollama is installed
    if command -v ollama &> /dev/null; then
        echo "✓ Ollama is already installed"
    else
        echo "Installing Ollama..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            curl -fsSL https://ollama.ai/install.sh | sh
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -fsSL https://ollama.ai/install.sh | sh
        else
            echo "⚠ Please install Ollama manually from: https://ollama.ai"
        fi
    fi
    
    echo ""
    echo "Downloading Llama 3.2 model..."
    ollama pull llama3.2
    
    # Enable Ollama in .env.local
    sed -i "s|# VITE_USE_OLLAMA=true|VITE_USE_OLLAMA=true|" .env.local
    sed -i "s|# VITE_OLLAMA_URL=|VITE_OLLAMA_URL=|" .env.local
    sed -i "s|# VITE_OLLAMA_MODEL=|VITE_OLLAMA_MODEL=|" .env.local
    
    echo "✓ Ollama configured"
else
    echo "Invalid choice. Please run the script again."
    exit 1
fi

echo ""
echo "========================================"
echo "   Setup Complete! 🎉"
echo "========================================"
echo ""
echo "Your .env.local file has been configured."
echo ""
echo "Next steps:"
echo "1. Install dependencies: npm install"
echo "2. Start development server: npm run dev"
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "For more details, see:"
echo "- README.md for general setup"
echo "- AI_SETUP.md for AI configuration"
echo "- SUPABASE_SETUP.md for database setup"
echo ""
