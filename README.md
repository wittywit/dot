# Day Planner PWA - Dot

A simple, elegant day planner Progressive Web App built with Next.js and React.

## Features

- 📅 Day, Week, and Month views
- ✅ Task management with scheduling
- 🔔 Browser notifications
- 📱 PWA support (installable)
- 🌙 Dark/Light mode
- 📊 Task statistics
- 🔄 Recurring tasks
- 📝 Unscheduled task list

## Live Demo

Visit: [https://wittywit.github.io/dot/](https://wittywit.github.io/dot/)

## GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages. Follow these steps:

### 1. Create a new GitHub repository
- Create a new repository named `dot` on GitHub
- Make sure it's public (required for GitHub Pages)

### 2. Push your code
```bash
git remote add origin https://github.com/wittywit/dot.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages
- Go to your repository Settings → Pages
- Source: GitHub Actions
- The site will deploy automatically on every push to main

### 4. Update the base path (if needed)
If your repository is not named `dot`, update the `basePath` in `next.config.mjs`:
```javascript
basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
```

## Local Development

```bash
pnpm install    # Install dependencies
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm lint       # Run ESLint
```

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Radix UI
- Lucide React Icons

## License

MIT License
