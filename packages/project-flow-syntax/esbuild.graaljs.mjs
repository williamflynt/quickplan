//@ts-check
import * as esbuild from 'esbuild';

esbuild.build({
    bundle: true,
    entryPoints: ["src/cli/graal/entrypoint.ts"],
    format: 'iife',
    inject: ['src/cli/graal/shims.js'],
    outfile: "out/graaljs/parser.js",
    platform: 'browser',
    target: ['es2022'],
});
