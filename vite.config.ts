import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig({
	root: "src",
	plugins: [
		react(),
		// viteStaticCopy({
		// 	targets: [
		// 		{
		// 			src: path.resolve(
		// 				__dirname,
		// 				"node_modules/ace-builds/src-min-noconflict/worker-*.js",
		// 			),
		// 			dest: ".",
		// 		},
		// 	],
		// }),
	],
	server: {
		port: 1420,
		strictPort: true,
		watch: {
			usePolling: true,
			ignored: ["**/src-tauri/**"],
		},
	},
	clearScreen: false,
	build: {
		outDir: "../dist",
		emptyOutDir: true,
		target: "esnext",
		modulePreload: false,
	},
});
