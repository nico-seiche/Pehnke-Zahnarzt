# MCP Servers

The repo ships project-scoped [MCP](https://modelcontextprotocol.io) servers in **`.mcp.json`** (repo root). MCP clients such as Claude Code pick this file up automatically and ask for a one-time approval per server the first time you open a session in the repo. Both servers run via `npx`, so there is nothing to install beforehand.

They complement each other during development: **next-devtools** looks at the app from the inside (the Next.js dev server), **chrome-devtools** looks at it from the outside (a real Chrome rendering the page).

## `next-devtools`

[next-devtools-mcp](https://www.npmjs.com/package/next-devtools-mcp) gives the agent access to the Next.js runtime and docs:

- Discovers running dev servers and queries their built-in MCP endpoint (Next.js 16+ exposes `/_next/mcp` automatically) for compilation and runtime errors, routes, and build status.
- Points the agent at the version-accurate docs bundled inside `node_modules/next/dist/docs/`, so answers match the installed Next.js version.

Requires the dev server to be running (`npm run dev`) for runtime queries; the docs lookup works without it.

## `chrome-devtools`

[chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) lets the agent drive and inspect a live Chrome instance through DevTools. Typical uses in this repo:

- **Performance**: record traces with lab LCP/CLS/INP plus DevTools insights (LCP breakdown, layout shift culprits, render-blocking requests), run Lighthouse audits, and apply CPU/network throttling. Useful for checking scroll-driven sections and page transitions under load.
- **Animations**: record screencasts (video) of transitions and scroll animations, then review them frame by frame; query `document.getAnimations()` or computed styles mid-animation via script evaluation.
- **Rendering**: screenshots (full page or per element) across viewport sizes, DOM/accessibility snapshots, console messages with source-mapped stack traces, and network request inspection.

### Configured flags

The entry in `.mcp.json` sets:

- `--isolated`: a temporary Chrome profile per launch, cleaned up on close. Keeps performance numbers reproducible (no warm cache or service workers) and keeps agent browsing out of a persistent profile.
- `--viewport=1920x1080`: consistent desktop baseline for screenshots and layout checks.
- `--experimentalScreencast`: enables video recording of the page. Requires **ffmpeg** on `PATH` (`brew install ffmpeg`); without it only the two screencast tools fail, everything else works.
- `--screenshotFormat=jpeg` and `--screenshotMaxWidth=1440`: screenshots enter the agent's context window, so they are compressed and downscaled to stay cheap. Remove the max-width flag if you need pixel-exact captures.
- `--no-usage-statistics`: opts out of the tool's telemetry.

### Requirements and notes

- Node.js LTS and a current stable Chrome; the server launches Chrome itself on first tool use.
- The browser instance is fully exposed to the MCP client: it can inspect and modify anything in that Chrome. The isolated profile keeps this away from personal browsing data; avoid logging into sensitive accounts inside it.
- Performance tools send traced URLs to Google's CrUX API to fetch real-user field data alongside lab results (only public URLs return data; localhost has none). Add `--no-performance-crux` to disable.

### Example prompts

- "Record a screencast of navigating from the home page to a project page on localhost:3000 and check the view transition"
- "Trace localhost:3000 with 4x CPU throttling and report what causes layout shifts"
- "Screenshot the hero section at 375, 768, and 1920 wide and compare"
