# Pantera Resort – Phase 1

Static landing site deployed via GitHub Pages.

## Structure
- `index.html` – main page (EN/AR toggle)
- `styles.css` – theme (desert accent, matches logo tones)
- `public/images/logo.jpg` – current logo
- `public/fonts/pantera.woff2` – (placeholder) drop actual font file here
- `.github/workflows/deploy.yml` – CI for Pages
- `menu/`, `admin/`, `data/` – reserved for next phases

## Deploy
1. Push this folder to `git@github.com:idexteir/PanteraResort.git` on branch `main`.
2. In GitHub: **Settings → Pages → Build and deployment** → Source: **GitHub Actions**.
3. On push, the workflow publishes the site.

## Customize
- Replace WhatsApp/phone/email links inside `index.html`.
- If you have the brand font, place `pantera.woff2` in `public/fonts/` (keep same name).
- To add a custom domain later, configure DNS (Cloudflare recommended) and add it in **Settings → Pages**.
