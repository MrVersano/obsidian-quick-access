import esbuild from "esbuild";
import { builtinModules } from "node:module";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const production = process.argv[2] === "production";
// If the better-backlinks test vault sits next to this project, each build is
// copied into it so it can be tried in Obsidian.
const testVault = "../better-backlinks/test-vault";
const testPluginDir = `${testVault}/.obsidian/plugins/quick-access`;

const copyToTestVault = {
	name: "copy-to-test-vault",
	setup(build) {
		build.onEnd((result) => {
			if (result.errors.length || !existsSync(testVault)) return;
			mkdirSync(testPluginDir, { recursive: true });
			for (const file of ["main.js", "manifest.json"]) {
				copyFileSync(file, `${testPluginDir}/${file}`);
			}
		});
	},
};

const context = await esbuild.context({
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		...builtinModules,
	],
	format: "cjs",
	target: "es2022",
	logLevel: "info",
	sourcemap: production ? false : "inline",
	treeShaking: true,
	minify: production,
	outfile: "main.js",
	plugins: [copyToTestVault],
});

if (production) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}
