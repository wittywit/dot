# GitHub Pages Deployment Guide

This guide will help you deploy your Day Planner app to GitHub Pages.

## Prerequisites

- A GitHub account
- Git installed on your local machine
- Node.js and pnpm installed

## Step-by-Step Deployment

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Name your repository `dot`
4. Make sure it's **public** (required for GitHub Pages)
5. Don't initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### 2. Push Your Code

Run these commands in your project directory:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit: Day Planner PWA"

# Add the remote repository
git remote add origin https://github.com/wittywit/dot.git

# Set the main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "GitHub Actions"
5. The deployment will start automatically

### 4. Monitor Deployment

1. Go to the "Actions" tab in your repository
2. You should see a workflow running called "Deploy Next.js site to Pages"
3. Wait for it to complete (usually takes 2-3 minutes)
4. Once complete, you'll see a green checkmark

### 5. Access Your Site

Your site will be available at:
`https://wittywit.github.io/dot/`

## Troubleshooting

### If the deployment fails:

1. Check the Actions tab for error messages
2. Common issues:
   - Repository must be public
   - Make sure all files are committed and pushed
   - Check that the repository name matches the basePath in `next.config.mjs`

### If you used a different repository name:

Update the `basePath` in `next.config.mjs`:
```javascript
basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
```

### If the site loads but assets are missing:

This usually means the basePath is incorrect. Double-check that it matches your repository name.

## Local Testing

Before deploying, test your build locally:

```bash
pnpm build
pnpm start
```

## Continuous Deployment

Once set up, every push to the `main` branch will automatically trigger a new deployment. You can monitor deployments in the Actions tab.

## Custom Domain (Optional)

If you want to use a custom domain:

1. Go to repository Settings → Pages
2. Add your custom domain
3. Update your DNS settings as instructed
4. The site will be available at your custom domain

## Support

If you encounter issues:
1. Check the GitHub Actions logs for error messages
2. Ensure all prerequisites are met
3. Verify the repository is public
4. Check that the basePath matches your repository name 