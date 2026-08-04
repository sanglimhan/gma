# Embedded landing page

This folder contains a standalone CRT/glitch landing module for embedding in Google Sites. It does not load the existing site's navigation, WebGL scene, external libraries, images, or audio.

## Files

- `index.html` — accessible page structure and display copy.
- `style.css` — responsive full-viewport layout, scanlines, RGB separation, and glitch styling.
- `script.js` — lightweight Canvas 2D noise, pointer/touch response, phrase rotation, and click/tap glitch bursts.

## GitHub Pages

Once GitHub Pages is enabled for the repository's published branch, the module is available at:

<https://sanglimhan.github.io/gma/landing/>

Use that URL as the source for a Google Sites embed. All asset references are relative, so the module also works from forks and project subpaths.

For local preview, run `python3 -m http.server 8000` from the repository root and open <http://localhost:8000/landing/>.
