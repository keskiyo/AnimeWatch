import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const currentDir = dirname(fileURLToPath(import.meta.url))
const backendTarget = process.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		host: 'localhost',
		port: 5173,
		strictPort: true,
		proxy: {
			'/sitemap.xml': backendTarget,
		},
	},
	preview: {
		host: 'localhost',
		port: 4173,
		proxy: {
			'/sitemap.xml': backendTarget,
		},
	},
	resolve: {
		alias: {
			'@': resolve(currentDir, 'src'),
		},
	},
})
