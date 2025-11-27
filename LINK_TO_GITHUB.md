# Link to Existing GitHub Repository

## Repository: twiggle-co/twiggle

### Option 1: Push to root of existing repo (if repo is empty or you want to replace)

```bash
cd C:\Users\jaron\Documents\projects\twiggle-frontend

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Add twiggle frontend application"

# Add remote repository
git remote add origin https://github.com/twiggle-co/twiggle.git

# Rename branch to main (if needed)
git branch -M main

# Pull any existing content first (if repo has content)
git pull origin main --allow-unrelated-histories

# Push to GitHub
git push -u origin main
```

### Option 2: Push to subfolder (if repo already has content)

If the repository already has other code, you might want to push this to a subfolder:

```bash
cd C:\Users\jaron\Documents\projects\twiggle-frontend

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Add twiggle frontend application"

# Add remote repository
git remote add origin https://github.com/twiggle-co/twiggle.git

# Pull existing content
git pull origin main --allow-unrelated-histories

# Move files to frontend subfolder (if needed)
# Note: This is only if you want files in a subfolder
# mkdir ../twiggle-temp
# git mv * ../twiggle-temp/
# mkdir frontend
# git mv ../twiggle-temp/* frontend/

# Commit the move (if you did the subfolder approach)
# git commit -m "Move frontend to subfolder"

# Push to GitHub
git push -u origin main
```

### Option 3: Use SSH (if you have SSH keys set up)

```bash
git remote add origin git@github.com:twiggle-co/twiggle.git
```

## Quick Setup Script

Run these commands in PowerShell:

```powershell
cd C:\Users\jaron\Documents\projects\twiggle-frontend
git init
git add .
git commit -m "Add twiggle frontend application"
git remote add origin https://github.com/twiggle-co/twiggle.git
git branch -M main
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## Troubleshooting

### If you get "repository not found":
- Check that you have access to `twiggle-co/twiggle`
- Verify the repository name is correct
- You may need to authenticate with a Personal Access Token

### If you get merge conflicts:
- The repo might have existing content
- Resolve conflicts or use `--allow-unrelated-histories` flag

### Authentication:
- GitHub no longer accepts passwords
- Use Personal Access Token: https://github.com/settings/tokens
- Or set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh



