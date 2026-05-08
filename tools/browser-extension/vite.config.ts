import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import manifest from './src/manifest';

export default defineConfig({
    plugins: [react(), crx({ manifest })],
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                panel: path.resolve(__dirname, 'src/panel/index.html'),
            },
        },
    },
});
