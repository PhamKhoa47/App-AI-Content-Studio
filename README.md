# Deployment to GitHub Pages

This project has been configured to be deployed to GitHub Pages with a custom domain (`phamkhoa.click`).

## Prerequisites
1. Ensure your code is pushed to a GitHub repository.
2. Make sure you have configured the custom domain `phamkhoa.click` in your domain registrar's DNS settings to point to GitHub Pages.

## Deployment Steps

1. Install the `gh-pages` package as a dev dependency:
   ```bash
   npm install -D gh-pages
   ```

2. Add the following scripts to your `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. Run the deploy command:
   ```bash
   npm run deploy
   ```

## Configuration Details
- **Base Path**: The `vite.config.ts` has been updated to use `base: '/'` which is required for custom domains on GitHub Pages.
- **SPA Routing**: A `public/404.html` and a redirect script in `index.html` have been added to handle React Router (SPA) paths correctly on GitHub Pages, preventing the "blank white screen" issue on direct URL access.
- **Custom Domain**: A `public/CNAME` file containing `phamkhoa.click` has been added so that GitHub Pages automatically configures the custom domain upon deployment.
- **Sentry Fetch Error**: The `Uncaught TypeError: Cannot set property fetch of #<Window>` error has been fixed by removing the Sentry `browserTracingIntegration` which was trying to override the read-only `window.fetch`.

## UI/UX Upgrade
- The application now uses a modern SaaS-style design.
- Typography has been updated to `Inter`.
- Primary colors have been shifted to a modern blue (`blue-600`) with a neutral gray background (`slate-50`).
- Cards feature soft shadows, rounded corners (`rounded-2xl`), and subtle hover animations.
- The layout remains functionally identical to preserve all business logic and API integrations.
