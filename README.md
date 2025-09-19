# Learn Electron Documentation

This directory contains the VitePress documentation site for the Learn Electron project.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run docs:dev
   ```

3. Build for production:
   ```bash
   npm run docs:build
   ```

4. Preview the built site:
   ```bash
   npm run docs:preview
   ```

## Project Structure

```
docs/
├── .vitepress/          # VitePress configuration
│   ├── config.js        # Main configuration file
│   └── theme/           # Custom theme
├── public/              # Static assets
│   ├── logo.svg
│   ├── favicon.svg
│   └── CNAME           # Custom domain configuration
├── _draft/             # Development guides
│   ├── architecture/
│   ├── memory/
│   └── trace/
├── index.md            # Homepage
├── begin.md            # Getting started guide
├── projects.md         # Project examples
└── rosetta.md          # Rosetta compatibility
```

## Deployment

The site is automatically deployed to GitHub Pages at [blog.zenheart.site/electron](https://blog.zenheart.site/electron) when changes are pushed to the main branch.

### GitHub Actions Workflow

The deployment is handled by `.github/workflows/deploy.yml` which:

1. Builds the VitePress site
2. Deploys to GitHub Pages
3. Configures custom domain

### Custom Domain Setup

1. Add your domain to the CNAME file in `docs/public/CNAME`
2. Configure your DNS to point to GitHub Pages
3. Enable custom domain in GitHub Pages settings

## Contributing

1. Add new documentation files as Markdown (`.md`)
2. The navigation will be automatically generated based on the file structure
3. Update the sidebar configuration in `.vitepress/config.js` if needed