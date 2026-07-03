#!/usr/bin/env bash
# VoiceFlow Pro - Testing and CI/CD Setup Script
# This script sets up the complete testing and CI/CD system

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 VoiceFlow Pro - Testing and CI/CD Setup"
echo "=========================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    echo "✅ $1"
}

print_warning() {
    echo "⚠️  $1"
}

print_error() {
    echo "❌ $1"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

if ! command_exists pip; then
    print_warning "pip is not installed. Some Python dependencies may not be available."
fi

NODE_VERSION=$(node -v | sed 's/v//')
echo "📦 Node.js version: $NODE_VERSION"

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "📦 Python version: $PYTHON_VERSION"

# Create necessary directories
echo ""
echo "📁 Creating directory structure..."
mkdir -p scripts
mkdir -p docs
mkdir -p .github/workflows

# Copy the scripts if they don't exist
if [ ! -f "$WORKSPACE_DIR/scripts/run_tests.py" ]; then
    echo "📋 Copying test runner script..."
    cp "$SCRIPT_DIR/run_tests.py" "$WORKSPACE_DIR/scripts/" 2>/dev/null || echo "Test runner already exists"
fi

# Setup each component
echo ""
echo "🔧 Setting up components..."

# Voice Recognition Engine
echo ""
echo "🎤 Setting up Voice Recognition Engine..."
cd "$WORKSPACE_DIR/voice-recognition-engine"

if [ ! -d "node_modules" ]; then
    echo "  Installing Node.js dependencies..."
    npm install
    print_status "Voice Recognition Engine dependencies installed"
else
    print_status "Voice Recognition Engine dependencies already installed"
fi

# Create test setup if missing
if [ ! -f "tests/setup.ts" ]; then
    echo "  Creating test setup..."
    cat > tests/setup.ts << 'EOF'
/**
 * Test setup for VoiceFlow Pro Voice Recognition Engine
 */

import { jest } from '@jest/globals';

// Mock Web Speech API
global.SpeechRecognition = class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  grammars: any = {};
  serviceURI = '';
  
  lang = 'en-US';
  
  onstart: ((this: any, ev: Event) => any) | null = null;
  onend: ((this: any, ev: Event) => any) | null = null;
  onresult: ((this: any, ev: any) => any) | null = null;
  onerror: ((this: any, ev: any) => any) | null = null;
  onsoundstart: ((this: any, ev: Event) => any) | null = null;
  onsoundend: ((this: any, ev: Event) => any) | null = null;
  onspeechstart: ((this: any, ev: Event) => any) | null = null;
  onspeechend: ((this: any, ev: Event) => any) | null = null;
  
  start(): void {
    setTimeout(() => {
      if (this.onstart) this.onstart(new Event('start'));
    }, 10);
  }
  
  stop(): void {
    setTimeout(() => {
      if (this.onend) this.onend(new Event('end'));
    }, 10);
  }
  
  abort(): void {
    if (this.onend) this.onend(new Event('end'));
  }
};

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockImplementation((constraints: MediaStreamConstraints): Promise<MediaStream> => {
      return Promise.resolve({
        getTracks: () => [{
          stop: jest.fn(),
          getSettings: jest.fn(() => ({}))
        }],
        getAudioTracks: () => [{
          stop: jest.fn(),
          getSettings: jest.fn(() => ({}))
        }]
      } as MediaStream);
    })
  }
});

// Mock AudioContext
global.AudioContext = class MockAudioContext {
  sampleRate = 44100;
  state = 'running';
  
  createMediaStreamSource = jest.fn().mockReturnValue({
    connect: jest.fn()
  });
  
  createAnalyser = jest.fn().mockReturnValue({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
    disconnect: jest.fn()
  });
  
  close = jest.fn().mockResolvedValue(undefined);
  resume = jest.fn().mockResolvedValue(undefined);
  suspend = jest.fn().mockResolvedValue(undefined);
};

// Set up test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
EOF
    print_status "Test setup created"
fi

# UI Components
echo ""
echo "🖥️  Setting up UI Components..."
cd "$WORKSPACE_DIR/voiceflow-pro-ui"

if [ ! -d "node_modules" ]; then
    echo "  Installing Node.js dependencies..."
    npm install
    print_status "UI Components dependencies installed"
else
    print_status "UI Components dependencies already installed"
fi

# Python Text Processor
echo ""
echo "🐍 Setting up Python Text Processor..."
cd "$WORKSPACE_DIR/ai_text_processor"

# Install Python dependencies
echo "  Installing Python dependencies..."
pip3 install pytest pytest-cov pytest-benchmark >/dev/null 2>&1 || print_warning "Some Python packages may not be installed"

if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt >/dev/null 2>&1 || print_warning "Some requirements may not be installed"
fi

print_status "Python Text Processor dependencies installed"

# Tauri App
echo ""
echo "📱 Setting up Tauri App..."
cd "$WORKSPACE_DIR/voiceflow-pro"

if [ ! -d "node_modules" ]; then
    echo "  Installing Node.js dependencies..."
    npm install
    print_status "Tauri App dependencies installed"
else
    print_status "Tauri App dependencies already installed"
fi

# Install Rust dependencies
echo "  Checking Rust toolchain..."
if command_exists cargo; then
    cd src-tauri
    cargo fetch >/dev/null 2>&1 || print_warning "Some Rust dependencies may not be installed"
    cd ..
    print_status "Rust dependencies ready"
else
    print_warning "Rust toolchain not found. Install Rust to build Tauri apps."
fi

# Run initial tests
echo ""
echo "🧪 Running initial test suite..."

echo "  Testing Voice Recognition Engine..."
cd "$WORKSPACE_DIR/voice-recognition-engine"
if npm test --silent >/dev/null 2>&1; then
    print_status "Voice Recognition Engine tests passed"
else
    print_warning "Some Voice Recognition Engine tests failed"
fi

echo "  Testing UI Components..."
cd "$WORKSPACE_DIR/voiceflow-pro-ui"
if npm test --silent >/dev/null 2>&1; then
    print_status "UI Component tests passed"
else
    print_warning "Some UI Component tests failed"
fi

echo "  Testing Python Text Processor..."
cd "$WORKSPACE_DIR/ai_text_processor"
if python3 -m pytest --quiet >/dev/null 2>&1; then
    print_status "Python Text Processor tests passed"
else
    print_warning "Some Python Text Processor tests failed"
fi

# Create summary
echo ""
echo "📊 Setup Summary"
echo "==============="
echo ""
echo "✅ Voice Recognition Engine: Ready for testing"
echo "✅ UI Components: Ready for testing"
echo "✅ Python Text Processor: Ready for testing"
echo "✅ Tauri App: Ready for building"
echo ""

# Print usage instructions
echo "🎯 Usage Instructions"
echo "===================="
echo ""
echo "Run all tests:"
echo "  make test-all"
echo ""
echo "Run tests for specific component:"
echo "  make test-voice-engine"
echo "  make test-ui"
echo "  make test-python"
echo ""
echo "Run tests in watch mode:"
echo "  make test-watch"
echo ""
echo "Run comprehensive test suite:"
echo "  python scripts/run_tests.py"
echo ""
echo "Generate test report:"
echo "  python scripts/run_tests.py --output report.txt --json-output results.json"
echo ""
echo "View help:"
echo "  make help"
echo ""

# Check for GitHub Actions
if [ -f "$WORKSPACE_DIR/.github/workflows/ci.yml" ]; then
    print_status "GitHub Actions CI/CD pipeline configured"
else
    print_warning "GitHub Actions CI/CD pipeline not found"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'make test-all' to verify everything works"
echo "2. Commit the changes to enable CI/CD"
echo "3. Check the documentation in docs/TESTING_AND_CICD.md"
echo ""
echo "Happy testing! 🚀"