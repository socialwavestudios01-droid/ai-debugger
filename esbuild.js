const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
    const context = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        outfile: 'dist/extension.js',
        external: ['vscode'],
        format: 'cjs',
        platform: 'node',
        sourcemap: !production,
        minify: production,
        logLevel: 'info'
    });

    if (watch) {
        await context.watch();
        console.log('Watching for changes...');
    } else {
        await context.rebuild();
        await context.dispose();
        console.log('Build complete!');
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});