import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
    manifest_version: 3,
    name: 'Presto ViewModelCache DevTools',
    version: '0.0.1',
    description:
        'Read-only DevTools panel for inspecting Presto ViewModelCache snapshots and cache misses.',
    permissions: ['activeTab', 'scripting'],
    host_permissions: ['<all_urls>'],
    devtools_page: 'src/devtools/index.html',
    background: {
        service_worker: 'src/background/index.ts',
        type: 'module',
    },
});
