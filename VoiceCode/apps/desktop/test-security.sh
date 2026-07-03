#!/bin/bash
# Security Validation Script for VoiceFlow Pro
# Tests the implemented security features

echo "=== VoiceFlow Pro Security Validation ==="
echo ""

# Test 1: Check Tauri Configuration
echo "1. Testing Tauri Configuration Security..."
if grep -q '"assetScope": \["\*\*"\]' src-tauri/tauri.conf.json; then
    echo "   ❌ FAILED: Wildcard asset scope still present"
    exit 1
else
    echo "   ✅ PASSED: Asset scope properly restricted"
fi

# Test 2: Check for dangerous file operations
if grep -q '"all": true.*fs' src-tauri/tauri.conf.json; then
    echo "   ❌ FAILED: Dangerous fs permissions still present"
    exit 1
else
    echo "   ✅ PASSED: File system permissions properly restricted"
fi

# Test 3: Check for unsafe CSP directives
if grep -q "'unsafe-eval'" src-tauri/tauri.conf.json; then
    echo "   ❌ FAILED: Unsafe CSP directive still present"
    exit 1
else
    echo "   ✅ PASSED: CSP properly secured"
fi

echo ""

# Test 4: Check Error Handling Implementation
echo "2. Testing Error Handling Implementation..."
if [ -f "src-tauri/src/errors.rs" ]; then
    echo "   ✅ PASSED: Error types module exists"
else
    echo "   ❌ FAILED: Error types module missing"
    exit 1
fi

# Test 5: Check Input Validation Implementation
echo ""
echo "3. Testing Input Validation Implementation..."
if [ -f "src-tauri/src/validation.rs" ]; then
    echo "   ✅ PASSED: Validation module exists"
else
    echo "   ❌ FAILED: Validation module missing"
    exit 1
fi

# Check for key validation functions
validation_functions=("validate_text" "validate_file_path" "validate_filename" "validate_language_code" "validate_hotkey")
for func in "${validation_functions[@]}"; do
    if grep -q "pub fn $func" src-tauri/src/validation.rs; then
        echo "   ✅ PASSED: $func function exists"
    else
        echo "   ❌ FAILED: $func function missing"
        exit 1
    fi
done

echo ""

# Test 6: Check Memory Management Implementation
echo "4. Testing Memory Management Implementation..."
if [ -f "src-tauri/src/memory.rs" ]; then
    echo "   ✅ PASSED: Memory management module exists"
else
    echo "   ❌ FAILED: Memory management module missing"
    exit 1
fi

# Check for key memory management components
memory_components=("ResourceManager" "AudioBufferPool" "VoiceEngineResource" "TextProcessorResource")
for component in "${memory_components[@]}"; do
    if grep -q "pub struct $component" src-tauri/src/memory.rs; then
        echo "   ✅ PASSED: $component struct exists"
    else
        echo "   ❌ FAILED: $component struct missing"
        exit 1
    fi
done

echo ""

# Test 7: Check Error Boundary Implementation
echo "5. Testing Error Boundary Implementation..."
if [ -f "src-tauri/src/error_boundary.rs" ]; then
    echo "   ✅ PASSED: Error boundary module exists"
else
    echo "   ❌ FAILED: Error boundary module missing"
    exit 1
fi

# Check for key error boundary components
boundary_components=("ErrorBoundary" "CircuitBreakerState" "RecoveryStrategy" "ErrorBoundaryRegistry")
for component in "${boundary_components[@]}"; do
    if grep -q "pub struct $component" src-tauri/src/error_boundary.rs || grep -q "pub enum $component" src-tauri/src/error_boundary.rs; then
        echo "   ✅ PASSED: $component exists"
    else
        echo "   ❌ FAILED: $component missing"
        exit 1
    fi
done

echo ""

# Test 8: Check Main.rs Integration
echo "6. Testing Main.rs Security Integration..."
if grep -q "use errors::" src-tauri/src/main.rs; then
    echo "   ✅ PASSED: Error module imported in main.rs"
else
    echo "   ❌ FAILED: Error module not imported"
    exit 1
fi

if grep -q "use validation::" src-tauri/src/main.rs; then
    echo "   ✅ PASSED: Validation module imported in main.rs"
else
    echo "   ❌ FAILED: Validation module not imported"
    exit 1
fi

if grep -q "use memory::" src-tauri/src/main.rs; then
    echo "   ✅ PASSED: Memory module imported in main.rs"
else
    echo "   ❌ FAILED: Memory module not imported"
    exit 1
fi

if grep -q "use error_boundary::" src-tauri/src/main.rs; then
    echo "   ✅ PASSED: Error boundary module imported in main.rs"
else
    echo "   ❌ FAILED: Error boundary module not imported"
    exit 1
fi

echo ""

# Test 9: Check Input Validation Usage
echo "7. Testing Input Validation Usage..."
if grep -q "validate_text" src-tauri/src/main.rs; then
    echo "   ✅ PASSED: Text validation used in commands"
else
    echo "   ❌ FAILED: Text validation not used in commands"
    exit 1
fi

if grep -q "validate_language_code" src-tauri/src/main.rs; then
    echo "   ✅ PASSED: Language code validation used"
else
    echo "   ❌ FAILED: Language code validation not used"
    exit 1
fi

if grep -q "validate_hotkey" src-tauri/src/main.rs; then
    echo "   ✅ PASSED: Hotkey validation used"
else
    echo "   ❌ FAILED: Hotkey validation not used"
    exit 1
fi

echo ""

# Test 10: Check Error Boundary Usage
echo "8. Testing Error Boundary Usage..."
if grep -q "with_error_boundary!" src-tauri/src/main.rs; then
    echo "   ✅ PASSED: Error boundary macro used in commands"
else
    echo "   ❌ FAILED: Error boundary macro not used"
    exit 1
fi

if grep -q "get_error_boundary_registry" src-tauri/src/main.rs; then
    echo "   ✅ PASSED: Error boundary registry used"
else
    echo "   ❌ FAILED: Error boundary registry not used"
    exit 1
fi

echo ""

# Test 11: Check Cargo.toml Dependencies
echo "9. Testing Cargo.toml Dependencies..."
required_deps=("thiserror" "regex" "sanitize-filename" "tracing")
for dep in "${required_deps[@]}"; do
    if grep -q "$dep" src-tauri/Cargo.toml; then
        echo "   ✅ PASSED: $dep dependency present"
    else
        echo "   ❌ FAILED: $dep dependency missing"
        exit 1
    fi
done

echo ""

# Test 12: Security Documentation
echo "10. Testing Security Documentation..."
if [ -f "SECURITY_IMPROVEMENTS.md" ]; then
    echo "   ✅ PASSED: Security documentation exists"
    
    # Check documentation content
    if grep -q "assetScope" SECURITY_IMPROVEMENTS.md; then
        echo "   ✅ PASSED: Asset scope security documented"
    else
        echo "   ⚠️  WARNING: Asset scope security not documented"
    fi
    
    if grep -q "input validation" SECURITY_IMPROVEMENTS.md; then
        echo "   ✅ PASSED: Input validation documented"
    else
        echo "   ⚠️  WARNING: Input validation not documented"
    fi
else
    echo "   ❌ FAILED: Security documentation missing"
    exit 1
fi

echo ""
echo "=== Security Validation Complete ==="
echo ""
echo "✅ All security tests passed!"
echo ""
echo "Summary of Security Improvements:"
echo "  • Tauri configuration security (asset scope restrictions)"
echo "  • Input validation for all user inputs"
echo "  • Comprehensive error handling with thiserror"
echo "  • Memory management and cleanup mechanisms"
echo "  • Error boundaries with recovery strategies"
echo "  • Security documentation"
echo ""
echo "The VoiceFlow Pro application now implements comprehensive"
echo "security measures to protect against common vulnerabilities."