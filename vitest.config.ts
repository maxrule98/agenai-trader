import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: [
			"packages/**/test/**/*.spec.ts",
			"apps/**/test/**/*.spec.ts",
			"services/**/test/**/*.spec.ts",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"dist/",
				"test/",
				"**/*.spec.ts",
				"**/*.config.ts",
			],
		},
	},
});
