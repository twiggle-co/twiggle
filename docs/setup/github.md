# GitHub Setup Guide

## Prerequisites

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - Or use: `winget install Git.Git` (Windows Package Manager)

2. **Create a GitHub account** (if you don't have one):
   - Go to: https://github.com
   - Sign up for a free account

## Step-by-Step Instructions

### Step 1: Initialize Git Repository

Open PowerShell or Command Prompt in the project directory and run:

```bash
cd C:\Users\jaron\Documents\projects\twiggle-frontend

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Twiggle frontend project"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `twiggle-frontend` (or your preferred name)
3. Description: "Twiggle frontend application"
4. Choose: **Private** or **Public**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### Step 3: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/twiggle-frontend.git

# Rename default branch to main (if needed)
git branch -M main

# Push code to GitHub
git push -u origin main
```

### Alternative: Using SSH (if you have SSH keys set up)

```bash
git remote add origin git@github.com:YOUR_USERNAME/twiggle-frontend.git
git branch -M main
git push -u origin main
```

## Quick Command Reference

```bash
# Check git status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull
```

## Troubleshooting

### If you get authentication errors:
- Use GitHub Personal Access Token instead of password
- Generate token: https://github.com/settings/tokens
- Use token as password when prompted

### If git is not recognized:
- Restart your terminal after installing Git
- Or add Git to your PATH manually

## Next Steps

After pushing:
1. Your code will be visible on GitHub
2. You can set up GitHub Actions for CI/CD
3. You can invite collaborators
4. You can create branches for features



