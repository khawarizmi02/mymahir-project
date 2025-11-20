# GIT WORKFLOW GUIDE
## House Rental Management System MVP

---

## 🌳 BRANCH STRATEGY

```
main (production)
  ↑
develop (integration/staging)
  ↑
feature/* or week/* (development)
```

### Branch Naming Convention

- **Main branch:** `main` (production only)
- **Integration branch:** `develop` (testing before production)
- **Feature branches:** `feature/property-crud` or `week/2`
- **Hotfix branches:** `hotfix/auth-bug` (if critical bug found)

---

## 📋 WORKFLOW STEPS

### 1. START OF WEEK (Monday Morning)

```bash
# Pull latest develop
git checkout develop
git pull origin develop

# Create week branch (optional but recommended)
git checkout -b week/2

# (OR: Continue on develop if you prefer)
git checkout develop
```

### 2. DAILY WORK

```bash
# Morning: pull latest
git pull origin develop

# Make changes to code

# Stage changes
git add .

# Commit with clear message
git commit -m "Week 2, Day 1: Implement S3 service"

# Push to remote
git push origin week/2  # (or develop)

# (Repeat multiple times per day)
```

### 3. END OF DAY

```bash
# Make sure all work is pushed
git status  # should show "nothing to commit"

git push origin week/2  # (or develop)

# Verify on GitHub
# https://github.com/khawarizmi02/rental-mvp-2025
```

### 4. END OF WEEK (Sunday Evening)

```bash
# If using feature branch, merge to develop
git checkout develop
git pull origin develop

git merge week/2  # merge feature branch

# If conflicts, resolve them
git status  # check conflicted files
# Edit files to resolve
git add resolved-files
git commit -m "Merge week/2 into develop"

git push origin develop

# Tag the week
git tag -a week2 -m "Week 2 complete: Properties + S3"
git push origin week2

# Optional: Create weekly releases
# Go to GitHub → Releases → Create new release
# Tag: week2
# Title: Week 2: Properties + S3 Upload
# Description: [Summary of features completed]
```

### 5. WHEN READY FOR PRODUCTION (Week 3+)

```bash
# Merge develop to main (only when stable!)
git checkout main
git pull origin main

git merge develop

# Tag production release
git tag -a v1.0-alpha -m "Alpha release: MVP core features"
git tag -a v1.0 -m "v1.0 Release: MVP complete"

git push origin main --tags

# Create GitHub Release
# https://github.com/khawarizmi02/rental-mvp-2025/releases
# Tag: v1.0
# Title: MVP Release v1.0 - December 2025
# Description: [Full release notes]
```

---

## 💬 COMMIT MESSAGE FORMAT

Use clear, descriptive messages:

```bash
# Format: [Week] [Task]: [Description]

# Examples:
git commit -m "Week 2: S3 service - implement uploadPropertyImage()"
git commit -m "Week 2: Property API - add CRUD endpoints"
git commit -m "Week 2, UI: Property list component - display landlord properties"
git commit -m "Week 3: Tenancy API - create tenancy assignment endpoint"
git commit -m "Week 4: Maintenance - add photo upload to S3"
git commit -m "Week 5: Fix - manual payment approval logic edge case"
git commit -m "Week 6: Polish - improve error messages in forms"
git commit -m "Week 6: Docs - update README with deployment instructions"

# If fixing something:
git commit -m "Week 3: Bug fix - fix property status not updating on tenancy create"

# When merging:
git commit -m "Week 2 complete: Merge feature/properties into develop"
```

---

## ⚠️ IMPORTANT: NEVER COMMIT

Never commit these files:

```bash
# .env files (contain secrets)
.env
.env.local

# Node modules
node_modules/

# Build output
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

### Verify .gitignore

```bash
# Check what's being tracked
git ls-files

# If you accidentally committed .env:
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

## 🔀 HANDLING MERGE CONFLICTS

### If you see conflict during merge:

```bash
# Status shows conflicts
git status

# Open conflicted files and look for:
<<<<<<< HEAD
your changes here
=======
their changes here
>>>>>>> branch-name

# Edit to keep what you want, remove markers
# Re-add and commit
git add resolved-files
git commit -m "Resolve merge conflict between [branches]"
```

### Prevention is better:

```bash
# Pull before making changes (daily)
git pull origin develop

# Merge frequently (weekly, not all at once)
# Small changes = easy merge
```

---

## 📊 COMMON SCENARIOS

### Scenario 1: You want to see what changed this week

```bash
# See all commits in current branch vs develop
git log develop..HEAD --oneline

# See all changes in files
git diff develop

# See specific file changes
git diff develop -- server/src/services/property.service.ts
```

### Scenario 2: You want to undo your last commit

```bash
# Undo last commit but keep changes
git reset --soft HEAD~1
git add .
git commit -m "Fixed message"

# Undo last commit and DISCARD changes (dangerous!)
git reset --hard HEAD~1
```

### Scenario 3: You need to push to a different branch

```bash
# You committed to 'week/2' but wanted 'develop'
git push origin week/2
# Then ask team to merge via GitHub PR

# OR manually:
git checkout develop
git merge week/2
git push origin develop
```

### Scenario 4: You need to see someone else's changes

```bash
# Pull latest develop
git pull origin develop

# Switch to their branch to review
git checkout origin/their-branch

# Back to your work
git checkout week/2
```

---

## 📝 GITHUB PULL REQUESTS (Optional but Recommended)

### If using PRs for code review:

```bash
# Push your branch
git push origin week/2

# Go to GitHub and create PR:
# https://github.com/khawarizmi02/rental-mvp-2025/compare/develop...week/2

# Fill in PR template:
# Title: Week 2: Properties + S3 Upload
# Description:
# - Implemented Property CRUD API
# - Added S3 image upload
# - Created property UI components
# 
# Related PRD: [link to PRD.md]
# Closes: [any related issues]

# Request review from team members
# Discuss changes
# Merge when approved
```

---

## 🏷️ TAGGING RELEASES

### After Week 3 MVP is deployed:

```bash
# Tag the commit
git tag -a v1.0-beta -m "MVP Beta Release: Core features working"

# Push tag
git push origin v1.0-beta

# View all tags
git tag -l

# View tag details
git show v1.0-beta
```

### Release checklist:

```bash
# Merge to main
git checkout main
git merge develop
git push origin main

# Create tag
git tag -a v1.0 -m "v1.0: MVP Release - December 2025"
git push origin v1.0

# Go to GitHub Releases and create a new release from tag
# Add release notes, download links, etc.
```

---

## 🚨 EMERGENCY: ROLLBACK

If something breaks in production:

```bash
# See recent commits on main
git log main --oneline -5

# Revert to previous version
git checkout main
git revert 9f5f3d1  # commit hash to revert

# OR: reset (use with caution)
git reset --hard v1.0-beta  # tag name

git push origin main

# Create hotfix branch
git checkout -b hotfix/critical-bug
# Fix the bug
# Test locally
git push origin hotfix/critical-bug
# Create PR and merge to main
```

---

## 📊 USEFUL GIT COMMANDS

```bash
# See history
git log --oneline -10

# See branches
git branch -a  # all branches
git branch     # local branches only

# See current status
git status

# See what files changed
git diff

# See specific file history
git log -- server/src/services/property.service.ts

# See who changed what
git blame server/src/services/property.service.ts

# Search for commit
git log --grep="S3"
git log --grep="property" --oneline

# See commits not yet pushed
git log origin/develop..HEAD

# Clean up old branches
git branch -d week/2  # delete local
git push origin --delete week/2  # delete remote

# Rename branch
git branch -m old-name new-name
```

---

## 🔐 SECURITY CHECKLIST

Before every push:

- [ ] No `.env` files included
- [ ] No API keys or secrets in code
- [ ] No passwords in commit messages
- [ ] No node_modules directory
- [ ] No build output directories
- [ ] Code reviewed by at least one person

```bash
# See what you're about to push
git diff --name-only origin/develop..HEAD

# Make sure it looks right before:
git push origin develop
```

---

## 👥 TEAM GIT ETIQUETTE

1. **Pull before you push**
   ```bash
   git pull origin develop
   git push origin develop
   ```

2. **Commit frequently** (multiple times per day)

3. **Use descriptive messages** (future you will thank you)

4. **Don't force push** (unless you really know what you're doing)
   ```bash
   git push --force  # ⚠️ Can overwrite team's work!
   ```

5. **Keep branches in sync**
   ```bash
   git pull origin develop  # daily
   git merge develop  # before pushing feature branch
   ```

6. **Communicate** - Tell team when doing risky operations

---

## 📚 REFERENCE

**Git Cheat Sheet:** https://github.github.com/training-kit/

**GitHub Docs:** https://docs.github.com

**Atlassian Git Guide:** https://www.atlassian.com/git/tutorials

---

## 🎯 QUICK REFERENCE FOR EACH ROLE

### Khawa (Backend)

```bash
# Daily workflow
git pull origin develop
# Make backend changes
npm run dev  # test locally
git commit -m "Week X: [feature] - [description]"
git push origin develop

# When ready to deploy
git checkout main
git merge develop
git push origin main
```

### Islam (Frontend)

```bash
# Daily workflow
git pull origin develop
# Make frontend changes
ng serve --proxy-config proxy.conf.json  # test locally
git commit -m "Week X, UI: [feature] - [description]"
git push origin develop

# When ready for deployment
git checkout main
git merge develop
git push origin main
```

### Amsyar (DevOps)

```bash
# Weekly deployment
git checkout main
git pull origin main

# Verify all changes
git log main --oneline -10

# Check Docker build
docker build -t rental-mvp .

# Deploy
git push origin main  # triggers Railway auto-deploy
railway logs  # monitor

# Tag release
git tag -a week2 -m "Week 2 deployed"
git push origin week2
```

---

## 🚀 YOU'RE READY TO COMMIT!

Start with `git checkout -b week/2` and go! 🎉
