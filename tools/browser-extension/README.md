# Presto ViewModelCache DevTools Extension

Read-only Chromium DevTools extension for inspecting Presto `ViewModelCache` snapshots and cache/miss events.

## Location

- Workspace root: `tools/browser-extension`
- Extension output (after build): `tools/browser-extension/dist`

## Prerequisites

1. Use the repo Node version:

```bash
source ~/.nvm/nvm.sh && nvm use
```

2. Install dependencies from repo root (required so workspace dev dependencies like `vite` are available):

```bash
yarn install
```

## Commands (from repo root)

- Run extension tests:

```bash
yarn extension:test
```

- Build extension:

```bash
yarn extension:build
```

- Optional dev command:

```bash
yarn extension:dev
```

## Load in Chromium

1. Build extension:

```bash
yarn extension:build
```

2. Open Chromium and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select:
   - `tools/browser-extension/dist`

## Open the DevTools panel

1. Open any page that uses `@prestojs/viewmodel`.
2. Open DevTools.
3. Select the **Presto Cache** panel.

## Expected behavior

- Panel polls for events every 500ms.
- Uses extension runtime messaging + background `chrome.scripting.executeScript` (no `inspectedWindow.eval`).
- Shows:
  - model filter
  - event timeline (write/delete/deleteAll/miss)
  - snapshot inspector
- `Clear Timeline` clears both panel state and the underlying bridge event buffer.
- Resets timeline when inspected tab navigates.

## Bridge requirements

The inspected page must expose:

- `window.__PRESTOJS_VIEWMODEL_DEVTOOLS__`

This bridge is provided by `@prestojs/viewmodel` experimental devtools support and is enabled by default in development builds.

## Troubleshooting

### "Bridge unavailable" in panel

Likely causes:

- page is not using the updated `@prestojs/viewmodel` build
- inspected page is a production build (bridge disabled by default)
- page does not use `ViewModelCache`

### CSP / `unsafe-eval` issue in DevTools

The extension does not rely on `inspectedWindow.eval`; it uses `chrome.scripting.executeScript`
from the background worker. If you still see CSP-eval errors, reload the unpacked extension and
the inspected tab to ensure you are running the latest build.

### `yarn extension:build` fails with `vite: command not found`

- run `yarn install` at repo root first, then retry

## Manual verification checklist

1. Build + load extension in Chromium.
2. Open app page with active `ViewModelCache` usage.
3. Confirm snapshot contains model data.
4. Trigger known cache misses (eg missing requested fields from backend response).
5. Confirm miss events include reason and normalized/requested fields.
6. Trigger write/delete operations and confirm timeline updates.
7. Navigate tab and confirm timeline reset.
