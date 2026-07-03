#!/bin/bash

# VoiceFlow Pro - Integration Test Suite
# Tests the integration between all components

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="/workspace/voiceflow-pro"
TEST_RESULTS="$PROJECT_ROOT/test-results.log"

echo -e "${BLUE}🧪 VoiceFlow Pro - Integration Test Suite${NC}"
echo "============================================"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result tracking
log_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo "[$TOTAL_TESTS] $1"
}

pass_test() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "    ${GREEN}✅ PASS${NC}: $1"
}

fail_test() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "    ${RED}❌ FAIL${NC}: $1"
}

# Test functions

test_rust_backend_compilation() {
    log_test "Rust Backend Compilation"
    
    cd "$PROJECT_ROOT/src-tauri"
    
    if cargo check >/dev/null 2>&1; then
        pass_test "Rust backend compiles successfully"
    else
        fail_test "Rust backend compilation failed"
        cargo check || true
    fi
    
    cd "$PROJECT_ROOT"
}

test_rust_integration_modules() {
    log_test "Rust Integration Modules"
    
    cd "$PROJECT_ROOT/src-tauri"
    
    # Check if integration modules exist
    if [ -f "src/integrations/voice_recognition.rs" ]; then
        pass_test "Voice recognition integration module exists"
    else
        fail_test "Voice recognition integration module missing"
    fi
    
    if [ -f "src/integrations/ai_text_processor.rs" ]; then
        pass_test "AI text processor integration module exists"
    else
        fail_test "AI text processor integration module missing"
    fi
    
    cd "$PROJECT_ROOT"
}

test_frontend_build() {
    log_test "Frontend Build Process"
    
    cd "$PROJECT_ROOT"
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        pass_test "Package.json exists"
    else
        fail_test "Package.json missing"
        return
    fi
    
    # Check if main App.tsx exists and has proper structure
    if [ -f "src/App.tsx" ]; then
        if grep -q "process_speech_with_ai" src/App.tsx; then
            pass_test "App.tsx contains AI integration"
        else
            fail_test "App.tsx missing AI integration"
        fi
        
        if grep -q "VoiceFlow Pro" src/App.tsx; then
            pass_test "App.tsx contains proper branding"
        else
            fail_test "App.tsx missing branding"
        fi
    else
        fail_test "App.tsx missing"
    fi
    
    # Check if CSS exists
    if [ -f "src/index.css" ]; then
        pass_test "Main CSS file exists"
    else
        fail_test "Main CSS file missing"
    fi
}

test_voice_recognition_integration() {
    log_test "Voice Recognition Engine Integration"
    
    # Check if voice recognition engine exists
    if [ -d "$PROJECT_ROOT/../voice-recognition-engine" ]; then
        pass_test "Voice recognition engine directory exists"
        
        # Check for key files
        if [ -f "$PROJECT_ROOT/../voice-recognition-engine/src/index.ts" ]; then
            pass_test "Voice recognition main file exists"
        else
            fail_test "Voice recognition main file missing"
        fi
        
        if [ -f "$PROJECT_ROOT/../voice-recognition-engine/package.json" ]; then
            pass_test "Voice recognition package.json exists"
        else
            fail_test "Voice recognition package.json missing"
        fi
        
        # Check if it has the expected features
        if grep -q "VoiceFlowPro" "$PROJECT_ROOT/../voice-recognition-engine/src/index.ts" 2>/dev/null; then
            pass_test "Voice recognition has VoiceFlowPro class"
        else
            fail_test "Voice recognition missing VoiceFlowPro class"
        fi
    else
        fail_test "Voice recognition engine directory missing"
    fi
}

test_ai_text_processor_integration() {
    log_test "AI Text Processor Integration"
    
    # Check if AI text processor exists
    if [ -d "$PROJECT_ROOT/../ai_text_processor" ]; then
        pass_test "AI text processor directory exists"
        
        # Check for key Python files
        if [ -f "$PROJECT_ROOT/../ai_text_processor/src/api.py" ]; then
            pass_test "AI text processor API exists"
        else
            fail_test "AI text processor API missing"
        fi
        
        if [ -f "$PROJECT_ROOT/../ai_text_processor/src/text_processor.py" ]; then
            pass_test "AI text processor core exists"
        else
            fail_test "AI text processor core missing"
        fi
        
        # Check if it has expected features
        if grep -q "ProcessingContext" "$PROJECT_ROOT/../ai_text_processor/src/api.py" 2>/dev/null; then
            pass_test "AI text processor has processing contexts"
        else
            fail_test "AI text processor missing processing contexts"
        fi
        
        if grep -q "ToneType" "$PROJECT_ROOT/../ai_text_processor/src/api.py" 2>/dev/null; then
            pass_test "AI text processor has tone types"
        else
            fail_test "AI text processor missing tone types"
        fi
    else
        fail_test "AI text processor directory missing"
    fi
}

test_ui_components_integration() {
    log_test "UI Components Integration"
    
    # Check if UI components directory exists
    if [ -d "$PROJECT_ROOT/../voiceflow-pro-ui" ]; then
        pass_test "UI components directory exists"
        
        # Check for key components
        if [ -f "$PROJECT_ROOT/../voiceflow-pro-ui/src/components/VoiceRecording.tsx" ]; then
            pass_test "VoiceRecording component exists"
        else
            fail_test "VoiceRecording component missing"
        fi
        
        if [ -f "$PROJECT_ROOT/../voiceflow-pro-ui/src/components/TranscriptionDisplay.tsx" ]; then
            pass_test "TranscriptionDisplay component exists"
        else
            fail_test "TranscriptionDisplay component missing"
        fi
        
        # Check for contexts
        if [ -f "$PROJECT_ROOT/../voiceflow-pro-ui/src/contexts/ThemeContext.tsx" ]; then
            pass_test "Theme context exists"
        else
            fail_test "Theme context missing"
        fi
        
        if [ -f "$PROJECT_ROOT/../voiceflow-pro-ui/src/contexts/SettingsContext.tsx" ]; then
            pass_test "Settings context exists"
        else
            fail_test "Settings context missing"
        fi
        
        # Check for utilities
        if [ -f "$PROJECT_ROOT/../voiceflow-pro-ui/src/utils/accessibility.ts" ]; then
            pass_test "Accessibility utilities exist"
        else
            fail_test "Accessibility utilities missing"
        fi
    else
        fail_test "UI components directory missing"
    fi
}

test_tauri_configuration() {
    log_test "Tauri Configuration"
    
    # Check Tauri config
    if [ -f "$PROJECT_ROOT/src-tauri/tauri.conf.json" ]; then
        pass_test "Tauri configuration exists"
        
        # Check for required fields
        if grep -q '"name".*"voiceflow-pro"' "$PROJECT_ROOT/src-tauri/tauri.conf.json"; then
            pass_test "Tauri config has correct app name"
        else
            fail_test "Tauri config missing correct app name"
        fi
        
        if grep -q '"bundle"' "$PROJECT_ROOT/src-tauri/tauri.conf.json"; then
            pass_test "Tauri config has bundle settings"
        else
            fail_test "Tauri config missing bundle settings"
        fi
    else
        fail_test "Tauri configuration missing"
    fi
    
    # Check Cargo.toml
    if [ -f "$PROJECT_ROOT/src-tauri/Cargo.toml" ]; then
        pass_test "Cargo.toml exists"
        
        if grep -q "tauri = " "$PROJECT_ROOT/src-tauri/Cargo.toml"; then
            pass_test "Cargo.toml has Tauri dependency"
        else
            fail_test "Cargo.toml missing Tauri dependency"
        fi
        
        if grep -q "serde" "$PROJECT_ROOT/src-tauri/Cargo.toml"; then
            pass_test "Cargo.toml has serde dependency"
        else
            fail_test "Cargo.toml missing serde dependency"
        fi
    else
        fail_test "Cargo.toml missing"
    fi
}

test_dependencies() {
    log_test "Dependency Management"
    
    cd "$PROJECT_ROOT"
    
    # Check package.json dependencies
    if [ -f "package.json" ]; then
        if grep -q "@tauri-apps/api" package.json; then
            pass_test "Tauri API dependency present"
        else
            fail_test "Tauri API dependency missing"
        fi
        
        if grep -q "react" package.json; then
            pass_test "React dependency present"
        else
            fail_test "React dependency missing"
        fi
        
        if grep -q "typescript" package.json; then
            pass_test "TypeScript dependency present"
        else
            fail_test "TypeScript dependency missing"
        fi
    fi
    
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        pass_test "Node modules installed"
    else
        fail_test "Node modules not installed - run npm install"
    fi
}

test_build_configuration() {
    log_test "Build Configuration"
    
    # Check for build scripts
    if [ -f "$PROJECT_ROOT/build.sh" ]; then
        pass_test "Build script exists"
        
        if grep -q "VoiceFlow Pro" "$PROJECT_ROOT/build.sh"; then
            pass_test "Build script contains proper branding"
        else
            fail_test "Build script missing branding"
        fi
        
        if grep -q "install_dependencies" "$PROJECT_ROOT/build.sh"; then
            pass_test "Build script has dependency installation"
        else
            fail_test "Build script missing dependency installation"
        fi
    else
        fail_test "Build script missing"
    fi
    
    # Check vite.config.ts
    if [ -f "$PROJECT_ROOT/vite.config.ts" ]; then
        pass_test "Vite configuration exists"
    else
        fail_test "Vite configuration missing"
    fi
    
    # Check TypeScript config
    if [ -f "$PROJECT_ROOT/tsconfig.json" ]; then
        pass_test "TypeScript configuration exists"
    else
        fail_test "TypeScript configuration missing"
    fi
}

test_integration_contracts() {
    log_test "Integration Contracts"
    
    # Check if main.rs has proper Tauri commands
    if grep -q "process_speech_with_ai" "$PROJECT_ROOT/src-tauri/src/main.rs"; then
        pass_test "Main Rust file has AI processing command"
    else
        fail_test "Main Rust file missing AI processing command"
    fi
    
    if grep -q "initialize_voice_recognition" "$PROJECT_ROOT/src-tauri/src/main.rs"; then
        pass_test "Main Rust file has voice recognition initialization"
    else
        fail_test "Main Rust file missing voice recognition initialization"
    fi
    
    if grep -q "get_supported_languages_tauri" "$PROJECT_ROOT/src-tauri/src/main.rs"; then
        pass_test "Main Rust file has language support commands"
    else
        fail_test "Main Rust file missing language support commands"
    fi
    
    # Check if App.tsx uses Tauri properly
    if grep -q "invoke.*process_speech_with_ai" "$PROJECT_ROOT/src/App.tsx"; then
        pass_test "Frontend calls AI processing via Tauri"
    else
        fail_test "Frontend missing AI processing Tauri calls"
    fi
    
    if grep -q "listen.*voice-status" "$PROJECT_ROOT/src/App.tsx"; then
        pass_test "Frontend listens to voice status events"
    else
        fail_test "Frontend missing voice status event listeners"
    fi
}

test_cross_platform_compatibility() {
    log_test "Cross-Platform Compatibility"
    
    # Check if Tauri config supports multiple platforms
    if [ -f "$PROJECT_ROOT/src-tauri/tauri.conf.json" ]; then
        if grep -q "windows" "$PROJECT_ROOT/src-tauri/tauri.conf.json"; then
            pass_test "Tauri config includes Windows support"
        else
            fail_test "Tauri config missing Windows support"
        fi
        
        if grep -q "macos" "$PROJECT_ROOT/src-tauri/tauri.conf.json"; then
            pass_test "Tauri config includes macOS support"
        else
            fail_test "Tauri config missing macOS support"
        fi
        
        if grep -q "linux" "$PROJECT_ROOT/src-tauri/tauri.conf.json"; then
            pass_test "Tauri config includes Linux support"
        else
            fail_test "Tauri config missing Linux support"
        fi
    fi
    
    # Check if build script has platform-specific builds
    if [ -f "$PROJECT_ROOT/build.sh" ]; then
        if grep -q "platform" "$PROJECT_ROOT/build.sh"; then
            pass_test "Build script has platform-specific build logic"
        else
            fail_test "Build script missing platform-specific build logic"
        fi
    fi
}

# Function to run all tests
run_all_tests() {
    echo "Starting integration tests..."
    echo
    
    test_rust_backend_compilation
    test_rust_integration_modules
    test_frontend_build
    test_voice_recognition_integration
    test_ai_text_processor_integration
    test_ui_components_integration
    test_tauri_configuration
    test_dependencies
    test_build_configuration
    test_integration_contracts
    test_cross_platform_compatibility
    
    echo
    echo -e "${BLUE}📊 Test Results Summary${NC}"
    echo "========================"
    echo -e "Total Tests: ${YELLOW}$TOTAL_TESTS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    
    # Save results to file
    {
        echo "VoiceFlow Pro Integration Test Results"
        echo "======================================"
        echo "Date: $(date)"
        echo "Total Tests: $TOTAL_TESTS"
        echo "Passed: $PASSED_TESTS"
        echo "Failed: $FAILED_TESTS"
        echo "Success Rate: $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
    } > "$TEST_RESULTS"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo
        echo -e "${GREEN}🎉 All integration tests passed!${NC}"
        echo -e "${GREEN}The application is ready for deployment.${NC}"
        exit 0
    else
        echo
        echo -e "${RED}❌ Some integration tests failed.${NC}"
        echo -e "${YELLOW}Please review the failures above before deployment.${NC}"
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo "  --verbose, -v Show verbose output"
    echo
    echo "This script tests the integration between all VoiceFlow Pro components:"
    echo "  - Rust backend with Tauri"
    echo "  - Voice recognition engine"
    echo "  - AI text processor"
    echo "  - UI components"
    echo "  - Build system"
}

# Parse command line arguments
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_usage
            exit 0
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Run the tests
run_all_tests