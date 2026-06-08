import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		host: 'localhost',
		port: 5173,
		strictPort: true,
	},
	preview: {
		host: 'localhost',
		port: 4173,
	},
	resolve: {
		alias: {
			'@': resolve(currentDir, 'src'),
		},
	},
})
