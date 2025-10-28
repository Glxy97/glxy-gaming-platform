#!/bin/bash

# GLXY Gaming Platform - Shell Aliases Setup
# Fügt praktische Kurzbefehle für die Entwicklung hinzu

echo "🚀 Setting up GLXY Gaming Platform aliases..."

# Bestimme Shell-Konfigurationsdatei
SHELL_RC=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
    echo "📝 Detected zsh shell - updating ~/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    if [ -f "$HOME/.bashrc" ]; then
        SHELL_RC="$HOME/.bashrc"
        echo "📝 Detected bash shell - updating ~/.bashrc"
    else
        SHELL_RC="$HOME/.bash_profile"
        echo "📝 Detected bash shell - updating ~/.bash_profile"
    fi
else
    echo "⚠️  Unknown shell - please add aliases manually"
    echo ""
    echo "Add these lines to your shell configuration:"
    cat <<EOF

# GLXY Gaming Platform Aliases
alias gdev="npm run dev:full"
alias gbuild="npm run build:full"
alias gtest="npm run test:full"
alias gsec="npm run security:scan"
alias gdeploy="npm run deploy:prod"
alias gdb="npm run db:migrate && npm run db:seed"

EOF
    exit 1
fi

# Backup der originalen Shell-Konfiguration
if [ -f "$SHELL_RC" ]; then
    cp "$SHELL_RC" "${SHELL_RC}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Created backup: ${SHELL_RC}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Entferne alte GLXY-Aliases falls vorhanden
if [ -f "$SHELL_RC" ]; then
    # Erstelle temporäre Datei ohne alte GLXY-Aliases
    grep -v "# GLXY Gaming Platform" "$SHELL_RC" | grep -v "alias gdev=" | grep -v "alias gbuild=" | grep -v "alias gtest=" | grep -v "alias gsec=" | grep -v "alias gdeploy=" | grep -v "alias gdb=" > "${SHELL_RC}.tmp"
    mv "${SHELL_RC}.tmp" "$SHELL_RC"
fi

# Füge neue GLXY-Aliases hinzu
cat >> "$SHELL_RC" <<'EOF'

# GLXY Gaming Platform Aliases
alias gdev="npm run dev:full"        # 🚀 Development Server
alias gbuild="npm run build:full"    # 🔨 Full Build + Tests + Lint
alias gtest="npm run test:full"      # 🧪 Complete Test Suite
alias gsec="npm run security:scan"   # 🔒 Security Scan
alias gdeploy="npm run deploy:prod"  # 🚢 Production Deploy
alias gdb="npm run db:migrate && npm run db:seed"  # 🗄️ Database Setup

EOF

echo "✅ Aliases successfully added to $SHELL_RC"
echo ""
echo "🔄 Please restart your terminal or run: source $SHELL_RC"
echo ""
echo "📋 Available commands:"
echo "  gdev     - Start development server"
echo "  gbuild   - Full build with quality checks"
echo "  gtest    - Run complete test suite"
echo "  gsec     - Security vulnerability scan"
echo "  gdeploy  - Deploy to production"
echo "  gdb      - Database migrate + seed"
echo ""
echo "🎮 Example usage:"
echo "  cd /opt/glxy-gaming"
echo "  gdev          # Start development"
echo "  gbuild        # Build for production"
echo "  gtest         # Run all tests"
echo ""
echo "✨ Setup complete! Happy coding!"