# ⚠️ Phase 5B: Directory Rename - Status Update

**Date**: December 23, 2025  
**Phase**: 5B - Directory Rename  
**Status**: ⚠️ BLOCKED - Git MV Not Working  
**Progress**: 95% (unchanged)

---

## 🚨 Issue Encountered

### Problem
The `git mv VoiceFlow-PRO VoiceCode` command is not working properly on Windows Git Bash.

**Symptoms**:
- Command appears to execute but doesn't actually rename the directory
- `VoiceFlow-PRO/` directory still exists
- `VoiceCode/` directory was not created
- Git status still shows `VoiceFlow-PRO/` paths

**Root Cause**:
This is a known issue with `git mv` on Windows when:
1. Renaming directories (not files)
2. There are uncommitted changes in the working tree
3. Using Git Bash on Windows

---

## 🔄 Alternative Solutions

### Option A: Manual Rename (Recommended for Windows)

**Step 1: Manually rename the directory**
```powershell
# Using Windows File Explorer:
# 1. Navigate to C:\Githhub\VoiceFlow-PRO\
# 2. Right-click on "VoiceFlow-PRO" folder
# 3. Select "Rename"
# 4. Change name to "VoiceCode"
# 5. Press Enter

# OR using PowerShell:
cd C:\Githhub\VoiceFlow-PRO
Rename-Item -Path "VoiceFlow-PRO" -NewName "VoiceCode"
```

**Step 2: Stage the rename in Git**
```bash
cd C:\Githhub\VoiceFlow-PRO
git add -A
git status  # Should show renamed files
```

**Step 3: Commit the rename**
```bash
git commit -m "chore: rename nested monorepo directory VoiceFlow-PRO → VoiceCode"
```

**Step 4: Push to remote**
```bash
git push origin chore/e2e-smoke-and-security-gating
```

---

### Option B: Use PowerShell Git Commands

```powershell
# Navigate to repository root
cd C:\Githhub\VoiceFlow-PRO

# Use PowerShell to rename
Move-Item -Path "VoiceFlow-PRO" -Destination "VoiceCode"

# Stage all changes
git add -A

# Commit
git commit -m "chore: rename nested monorepo directory VoiceFlow-PRO → VoiceCode"

# Push
git push origin chore/e2e-smoke-and-security-gating
```

---

### Option C: Commit Changes First, Then Rename

```bash
# 1. Commit all current changes
git add -A
git commit -m "docs: complete Phase 5A - rebrand all documentation"

# 2. Then try git mv again (should work with clean working tree)
git mv VoiceFlow-PRO VoiceCode
git commit -m "chore: rename nested monorepo directory VoiceFlow-PRO → VoiceCode"
git push origin chore/e2e-smoke-and-security-gating
```

---

## 📋 Remaining Steps After Directory Rename

Once the nested directory is successfully renamed:

### Step 2: Rename Root Directory
```bash
cd C:\Githhub
ren VoiceFlow-PRO VoiceCode
# OR
Rename-Item -Path "VoiceFlow-PRO" -NewName "VoiceCode"
```

### Step 3: Update Git Remote URL
```bash
cd C:\Githhub\VoiceCode
git remote set-url origin https://github.com/kimhons/VoiceCode.git
git remote -v  # Verify
```

### Step 4: Rename GitHub Repository
1. Go to https://github.com/kimhons/VoiceFlow-PRO/settings
2. Scroll to "Repository name"
3. Change from `VoiceFlow-PRO` to `VoiceCode`
4. Click "Rename"

### Step 5: Verify Everything Works
```bash
cd C:\Githhub\VoiceCode
git status
git pull
```

---

## 🎯 Current Status

- ✅ **Phase 5A Complete**: All documentation rebranded (380+ replacements)
- ⚠️ **Phase 5B Blocked**: Directory rename not working with `git mv`
- ⏳ **Awaiting**: User to choose alternative approach

---

## 💡 Recommendation

**I recommend Option A (Manual Rename)** because:
1. ✅ Most reliable on Windows
2. ✅ Works regardless of uncommitted changes
3. ✅ Git will automatically detect the rename when you `git add -A`
4. ✅ Preserves git history
5. ✅ Simple and straightforward

---

## 🚀 Next Steps

**Please choose one of the following:**

1. **Option A**: I'll guide you through manual rename using File Explorer or PowerShell
2. **Option B**: I'll use PowerShell Move-Item command
3. **Option C**: I'll commit all changes first, then retry `git mv`

**Which option would you like me to proceed with?**

---

**Note**: The rebranding is still 95% complete. Only the directory rename remains to reach 98%, and then the GitHub repository rename for the final 100%.

