# 📁 VoiceCode Directory Rename Guide

**Purpose**: Safely rename directories from VoiceFlow-PRO to VoiceCode  
**Risk Level**: Low (git mv preserves history, GitHub provides redirects)  
**Estimated Time**: 20 minutes  
**Prerequisites**: All documentation already updated ✅

---

## 🎯 Rename Strategy

### Current Structure
```
C:\Githhub\
├── VoiceFlow-PRO\                    ← Git root (rename to VoiceCode)
│   ├── .git\
│   ├── VoiceFlow-PRO\                ← Nested monorepo (rename to VoiceCode)
│   │   ├── apps\
│   │   ├── extensions\
│   │   ├── packages\
│   │   └── services\
│   └── [root files]
└── VoiceCodeMobile\                  ← Already renamed ✅
```

### Target Structure
```
C:\Githhub\
├── VoiceCode\                        ← Renamed
│   ├── .git\
│   ├── VoiceCode\                    ← Renamed
│   │   ├── apps\
│   │   ├── extensions\
│   │   ├── packages\
│   │   └── services\
│   └── [root files]
└── VoiceCodeMobile\                  ← Already renamed ✅
```

---

## 📋 Step-by-Step Instructions

### Step 1: Rename Nested Directory (Git Tracked)
**Purpose**: Rename the nested monorepo directory while preserving git history

```bash
# Navigate to git root
cd C:\Githhub\VoiceFlow-PRO

# Rename nested directory using git mv (preserves history)
git mv VoiceFlow-PRO VoiceCode

# Verify the rename
git status

# Commit the change
git commit -m "chore: rename nested monorepo directory VoiceFlow-PRO → VoiceCode"

# Push to remote
git push origin main
```

**Expected Output**:
```
renamed:    VoiceFlow-PRO/... -> VoiceCode/...
[main abc1234] chore: rename nested monorepo directory VoiceFlow-PRO → VoiceCode
 X files changed, 0 insertions(+), 0 deletions(-)
 rename VoiceFlow-PRO/... => VoiceCode/... (100%)
```

---

### Step 2: Rename Root Directory (Outside Git)
**Purpose**: Rename the git repository root directory

```bash
# Navigate to parent directory
cd C:\Githhub

# Rename root directory (Windows)
ren VoiceFlow-PRO VoiceCode

# OR using PowerShell
Rename-Item -Path "VoiceFlow-PRO" -NewName "VoiceCode"

# OR using Git Bash
mv VoiceFlow-PRO VoiceCode

# Verify the rename
dir
# Should show VoiceCode directory
```

**Expected Output**:
```
Directory of C:\Githhub

VoiceCode
VoiceCodeMobile
VoiceFlow-PRO.worktrees
```

---

### Step 3: Update Git Remote URL
**Purpose**: Point git to the new repository name on GitHub

```bash
# Navigate to renamed directory
cd C:\Githhub\VoiceCode

# Check current remote URL
git remote -v

# Update remote URL
git remote set-url origin https://github.com/kimhons/VoiceCode.git

# Verify the change
git remote -v
```

**Expected Output**:
```
origin  https://github.com/kimhons/VoiceCode.git (fetch)
origin  https://github.com/kimhons/VoiceCode.git (push)
```

---

### Step 4: Rename GitHub Repository
**Purpose**: Update the repository name on GitHub

**Via Web Interface**:
1. Go to https://github.com/kimhons/VoiceFlow-PRO
2. Click "Settings" tab
3. Scroll to "Repository name" section
4. Change from `VoiceFlow-PRO` to `VoiceCode`
5. Click "Rename" button
6. Confirm the rename

**Important Notes**:
- GitHub automatically creates redirects from old URLs to new URLs
- All existing links will continue to work
- Clone URLs will be updated automatically
- Issues, PRs, and other references are preserved

---

### Step 5: Verify Everything Works
**Purpose**: Ensure all git operations and builds still work

```bash
# Test git operations
cd C:\Githhub\VoiceCode
git status
git pull
git log --oneline -5

# Test VSCode Extension build
cd extensions\voiceflow-vscode
npm run compile

# Test Mobile App
cd ..\..\..
cd VoiceCodeMobile
npm start

# Test Web App
cd ..\VoiceCode\apps\web
npm run dev

# Test Desktop App
cd ..\desktop
npm run tauri:dev
```

---

## ✅ Verification Checklist

After completing all steps:

- [ ] Nested directory renamed: `VoiceCode\VoiceCode\` exists
- [ ] Root directory renamed: `C:\Githhub\VoiceCode\` exists
- [ ] Git remote URL updated to `https://github.com/kimhons/VoiceCode.git`
- [ ] GitHub repository renamed to `VoiceCode`
- [ ] `git status` shows clean working tree
- [ ] `git pull` works without errors
- [ ] VSCode extension compiles successfully
- [ ] Mobile app starts successfully
- [ ] Web app runs successfully
- [ ] Desktop app runs successfully
- [ ] No broken path references in code

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong, you can rollback:

```bash
# Rollback Step 1 (nested directory rename)
cd C:\Githhub\VoiceCode
git mv VoiceCode VoiceFlow-PRO
git commit -m "revert: rollback nested directory rename"
git push origin main

# Rollback Step 2 (root directory rename)
cd C:\Githhub
ren VoiceCode VoiceFlow-PRO

# Rollback Step 3 (remote URL)
cd C:\Githhub\VoiceFlow-PRO
git remote set-url origin https://github.com/kimhons/VoiceFlow-PRO.git

# Rollback Step 4 (GitHub rename)
# Go to GitHub settings and rename back to VoiceFlow-PRO
```

---

## 📊 Risk Assessment

| Step | Risk Level | Impact if Failed | Rollback Difficulty |
|------|-----------|------------------|---------------------|
| Step 1: Nested rename | Low | Git history preserved | Easy (git mv back) |
| Step 2: Root rename | Very Low | Local only | Very Easy (rename back) |
| Step 3: Remote URL | Very Low | Can't push/pull | Very Easy (set-url back) |
| Step 4: GitHub rename | Low | GitHub redirects work | Easy (rename back) |

**Overall Risk**: **Very Low** ✅

---

## 🚀 Ready to Execute?

All documentation has been updated. The directory rename is the final step to complete the rebranding.

**Confirm you want to proceed with:**
1. ✅ Renaming nested directory
2. ✅ Renaming root directory
3. ✅ Updating git remote URL
4. ✅ Renaming GitHub repository

**Once confirmed, I can guide you through each step or execute the commands for you.**

