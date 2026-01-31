#!/bin/bash

# The Exit Blueprint - AI Setup Helper Script
# This script helps you set up AI integration quickly

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   The Exit Blueprint - AI Integration Setup Helper     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✓ Found existing .env.local file"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Keeping existing .env.local file"
        echo "Edit it manually to configure AI providers"
        exit 0
    fi
    echo ""
fi

# Copy example file
echo "Copying .env.local.example to .env.local..."
cp .env.local.example .env.local
echo "✓ Created .env.local"
echo ""

# Ask which AI provider to use
echo "Which AI provider would you like to use?"
echo ""
echo "1) OpenAI (Cloud-based, best quality, requires API key)"
echo "2) Ollama (Self-hosted, free, requires local installation)"
echo "3) Skip AI setup for now"
echo ""
read -p "Enter your choice (1-3): " choice
echo ""

case $choice in
    1)
        echo "Setting up OpenAI..."
        echo ""
        echo "You'll need an OpenAI API key."
        echo "Get one from: https://platform.openai.com/api-keys"
        echo ""
        read -p "Enter your OpenAI API key (starts with sk-): " api_key
        
        if [ -z "$api_key" ]; then
            echo "No API key provided. You can add it later to .env.local"
        else
            # Update .env.local with the API key
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=$api_key|" .env.local
                sed -i '' "s|VITE_USE_OLLAMA=.*|VITE_USE_OLLAMA=false|" .env.local
            else
                # Linux
                sed -i "s|VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=$api_key|" .env.local
                sed -i "s|VITE_USE_OLLAMA=.*|VITE_USE_OLLAMA=false|" .env.local
            fi
            echo "✓ Configured OpenAI in .env.local"
        fi
        echo ""
        echo "OpenAI setup complete!"
        echo "Start the app with: npm run dev"
        ;;
        
    2)
        echo "Setting up Ollama..."
        echo ""
        
        # Check if Ollama is installed
        if command -v ollama &> /dev/null; then
            echo "✓ Ollama is installed"
            
            # Check if Ollama is running
            if curl -s http://localhost:11434/api/version &> /dev/null; then
                echo "✓ Ollama is running"
            else
                echo "⚠ Ollama is not running"
                echo "Start it with: ollama serve"
            fi
            
            # Check for models
            echo ""
            echo "Installed models:"
            ollama list
            echo ""
            echo "Recommended model: llama3.2"
            read -p "Do you want to download llama3.2 now? (y/N): " download
            if [ "$download" = "y" ] || [ "$download" = "Y" ]; then
                ollama pull llama3.2
                echo "✓ Downloaded llama3.2"
            fi
        else
            echo "⚠ Ollama is not installed"
            echo ""
            echo "Install Ollama:"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                echo "  macOS: brew install ollama"
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                echo "  Linux: curl -fsSL https://ollama.com/install.sh | sh"
            else
                echo "  Visit: https://ollama.com/download"
            fi
            echo ""
            echo "After installation:"
            echo "  1. Run: ollama serve"
            echo "  2. Download a model: ollama pull llama3.2"
            echo "  3. Start the app: npm run dev"
        fi
        
        # Update .env.local
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|VITE_USE_OLLAMA=.*|VITE_USE_OLLAMA=true|" .env.local
        else
            sed -i "s|VITE_USE_OLLAMA=.*|VITE_USE_OLLAMA=true|" .env.local
        fi
        echo ""
        echo "✓ Configured Ollama in .env.local"
        echo ""
        echo "Ollama setup complete!"
        echo "Make sure Ollama is running (ollama serve) before starting the app"
        ;;
        
    3)
        echo "Skipping AI setup"
        echo "You can configure AI later by editing .env.local"
        echo "See AI_SETUP.md for detailed instructions"
        ;;
        
    *)
        echo "Invalid choice. Skipping AI setup."
        echo "You can configure AI later by editing .env.local"
        ;;
esac

echo ""
echo "════════════════════════════════════════════════════════"
echo "Next steps:"
echo "  1. Review/edit .env.local if needed"
echo "  2. Start the development server: npm run dev"
echo "  3. See AI_SETUP.md for detailed documentation"
echo "════════════════════════════════════════════════════════"
