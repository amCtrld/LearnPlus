#!/bin/bash

# Phase 1 Verification Script
# Tests that all Phase 1 changes are working correctly

echo "========================================"
echo "Phase 1 Verification"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

# Test 1: Check expected answer removed from problem-step.tsx
echo "Test 1: Checking expected answer removed..."
if grep -q "step.expectedAnswer" components/problem-step.tsx; then
    echo -e "${RED}✗ FAILED${NC} - Expected answer still present in code"
    FAILED=$((FAILED+1))
else
    echo -e "${GREEN}✓ PASSED${NC} - Expected answer removed"
    PASSED=$((PASSED+1))
fi

# Test 2: Check TypeScript config fixed
echo "Test 2: Checking TypeScript config..."
if grep -q "ignoreBuildErrors: true" next.config.mjs; then
    echo -e "${RED}✗ FAILED${NC} - ignoreBuildErrors still enabled"
    FAILED=$((FAILED+1))
else
    echo -e "${GREEN}✓ PASSED${NC} - ignoreBuildErrors removed"
    PASSED=$((PASSED+1))
fi

# Test 3: Check env-validation.ts exists
echo "Test 3: Checking environment validation module..."
if [ -f "lib/env-validation.ts" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - env-validation.ts created"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗ FAILED${NC} - env-validation.ts not found"
    FAILED=$((FAILED+1))
fi

# Test 4: Check .env.example exists
echo "Test 4: Checking .env.example template..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - .env.example created"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗ FAILED${NC} - .env.example not found"
    FAILED=$((FAILED+1))
fi

# Test 5: Check .gitignore protects env files
echo "Test 5: Checking .gitignore..."
if grep -q ".env*.local" .gitignore; then
    echo -e "${GREEN}✓ PASSED${NC} - .gitignore protects env files"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗ FAILED${NC} - .gitignore doesn't protect env files"
    FAILED=$((FAILED+1))
fi

# Test 6: Check firebase.ts has validation
echo "Test 6: Checking Firebase validation integration..."
if grep -q "validateEnvironment" lib/firebase.ts; then
    echo -e "${GREEN}✓ PASSED${NC} - Firebase has validation"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗ FAILED${NC} - Firebase missing validation"
    FAILED=$((FAILED+1))
fi

# Test 7: Check dependencies installed
echo "Test 7: Checking critical dependencies..."
if grep -q '"nerdamer"' package.json && grep -q '"openai"' package.json; then
    echo -e "${GREEN}✓ PASSED${NC} - nerdamer and openai installed"
    PASSED=$((PASSED+1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Check package.json for nerdamer/openai"
    FAILED=$((FAILED+1))
fi

echo ""
echo "========================================"
echo "Results"
echo "========================================"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Phase 1 verification PASSED${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Create .env.local from .env.example"
    echo "2. Fill in your Firebase credentials"
    echo "3. Test app startup: npm run dev"
    echo "4. Review PHASE_1_SUMMARY.md"
    echo "5. Approve Phase 2 implementation"
    exit 0
else
    echo -e "${RED}✗ Phase 1 verification FAILED${NC}"
    echo ""
    echo "Please fix the failed tests before proceeding."
    exit 1
fi
