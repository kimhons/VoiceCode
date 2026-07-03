# ⚠️ Phase 5B: Manual Directory Rename Required

**Date**: December 23, 2025  
**Phase**: 5B - Directory Rename  
**Status**: ⚠️ REQUIRES MANUAL ACTION  
**Progress**: 95% → Awaiting manual rename to reach 98%

---

## 🚨 Situation

Automated directory rename commands (`git mv`, `Rename-Item`, `move`) are **failing** due to:
1. **Open file handles** - VSCode, Node processes, or other tools accessing the directory
2. **Windows file locking** - node_modules and other files are locked
3. **Permission issues** - Windows access denied errors

**What WAS accomplished:**
✅ **Step 1 Complete**: All rebranding documentation committed (46 files, 15,831 insertions)
- Commit: `e707bb8` - "docs: complete Phase 5A - rebrand all documentation (380+ replacements)"
- Branch: `chore/e2e-smoke-and-security-gating`
- Status: Ahead of origin by 1 commit

**What NEEDS to be done:**
⏳ **Step 2 Pending**: Rename nested directory `VoiceFlow-PRO/VoiceFlow-PRO/` → `VoiceFlow-PRO/VoiceCode/`

---

## 📋 Manual Rename Instructions

### Prerequisites
1. **Close all applications** that might be accessing the directory:
   - Close VSCode
   - Stop any running Node processes (`npm`, `pnpm`, `node`)
   - Close any terminals/command prompts in the directory
   - Close File Explorer windows showing the directory

### Step-by-Step Process

#### **Step 1: Close VSCode and Processes**
```powershell
# Close VSCode
# Press Ctrl+Shift+P → "File: Close Folder"
# Or just close VSCode entirely

# Kill any Node processes (if needed)
taskkill /F /IM node.exe /T
taskkill /F /IM Code.exe /T
```

#### **Step 2: Rename the Directory**

**Option A: Using File Explorer (Easiest)**
1. Open File Explorer
2. Navigate to `C:\Githhub\VoiceFlow-PRO\`
3. Find the `VoiceFlow-PRO` subdirectory
4. Right-click → Rename
5. Change name to `VoiceCode`
6. Press Enter

**Option B: Using PowerShell**
```powershell
# Open PowerShell as Administrator
# Navigate to the repository root
cd C:\Githhub\VoiceFlow-PRO

# Rename the directory
Rename-Item -Path "VoiceFlow-PRO" -NewName "VoiceCode"

# Verify
Get-ChildItem -Directory | Where-Object { $_.Name -like '*Voice*' }
```

**Option C: Using Command Prompt**
```cmd
cd C:\Githhub\VoiceFlow-PRO
ren VoiceFlow-PRO VoiceCode
dir | findstr Voice
```

#### **Step 3: Stage the Rename in Git**
```bash
# Reopen VSCode or terminal
cd C:\Githhub\VoiceFlow-PRO

# Git will detect the rename
git add -A

# Check status - should show renamed files
git status
```

#### **Step 4: Commit the Rename**
```bash
git commit -m "chore: rename nested monorepo directory VoiceFlow-PRO → VoiceCode"
```

#### **Step 5: Push to Remote**
```bash
git push origin chore/e2e-smoke-and-security-gating
```

---

## ✅ Verification Checklist

After renaming, verify:

- [ ] Directory `C:\Githhub\VoiceFlow-PRO\VoiceCode\` exists
- [ ] Directory `C:\Githhub\VoiceFlow-PRO\VoiceFlow-PRO\` does NOT exist
- [ ] `git status` shows renamed files (not deleted + untracked)
- [ ] Commit created successfully
- [ ] Push to remote successful

---

## 🎯 Expected Git Status After Rename

```bash
On branch chore/e2e-smoke-and-security-gating
Your branch is ahead of 'origin/chore/e2e-smoke-and-security-gating' by 2 commits.

Changes to be committed:
  renamed:    VoiceFlow-PRO/apps/... -> VoiceCode/apps/...
  renamed:    VoiceFlow-PRO/extensions/... -> VoiceCode/extensions/...
  renamed:    VoiceFlow-PRO/packages/... -> VoiceCode/packages/...
  ... (many more renamed files)
```

---

## 📊 Progress After Manual Rename

Once you complete the manual rename and commit:

```
[████████████████████████████████████████████████░░] 98%

Phase 1: VSCode Extension     ████████████████████ 100% ✅
Phase 2: Mobile App            ████████████████████ 100% ✅
Phase 3: Web App               ████████████████████ 100% ✅
Phase 4: Desktop App           ████████████████████ 100% ✅
Phase 5A: Documentation        ████████████████████ 100% ✅
Phase 5B: Directory Rename     ████████████████████ 100% ✅ (after manual rename)
Phase 5C: GitHub Rename        ░░░░░░░░░░░░░░░░░░░░   0% ⏳
```

---

## 🚀 Next Steps After Manual Rename

1. **Verify the rename** using the checklist above
2. **Inform me** that the rename is complete
3. **I will create** the Phase 5B completion document
4. **Proceed to Phase 5C**: GitHub repository rename (requires web interface)

---

## 💡 Why This Happened

Windows file locking is more aggressive than Unix systems:
- **node_modules** contains thousands of files that may be locked
- **VSCode** keeps file handles open for IntelliSense, file watching, etc.
- **Git** itself may have locks on the index
- **Antivirus** software may be scanning files

**This is normal** and the manual approach is the safest solution.

---

## ❓ Need Help?

If you encounter issues during manual rename:
1. Restart your computer (clears all file handles)
2. Try renaming immediately after restart (before opening VSCode)
3. Use Safe Mode if necessary
4. Check for antivirus interference

---

**Current Status**: Waiting for you to perform the manual directory rename.

**Once complete**, we'll be at **98% completion** with only the GitHub repository rename remaining!

