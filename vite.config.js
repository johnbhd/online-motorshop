import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],

    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,

        origin: 'http://localhost:5173',

        cors: {
            origin: 'http://localhost:8000',
        },

        hmr: {
            host: 'localhost',
            port: 5173,
        },
        watch: {
            //usePolling: true,
            interval: 100,
            ignored: ['**/storage/framework/views/**'],
        },

    },
});