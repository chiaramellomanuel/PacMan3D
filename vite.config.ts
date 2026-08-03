import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    base: command === 'build' ? '/PacMan3D/' : '/',
    plugins: [
		vue(),
		tailwindcss(),

		Components({
			resolvers: [
				IconsResolver({
					prefix: 'i',
				}),
			],
		}),

		Icons({
			compiler: 'vue3',
			autoInstall: true,
		}),
	],
  }
})