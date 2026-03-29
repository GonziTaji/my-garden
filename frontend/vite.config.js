import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { globSync } from "tinyglobby";
import path from "node:path"

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    build: {
        rolldownOptions: {
            // input: {
            //     "/", "index.html",
            //     ...Object.fromEntries(
            //     globSync("src/*.").map((file) => [
            //         // This removes `src/` as well as the file extension from each
            //         // file, so e.g. src/nested/foo.js becomes nested/foo, and
            //         // normalizes Windows backslashes to forward slashes.
            //         path
            //             .relative(
            //                 "src",
            //                 file.slice(
            //                     0,
            //                     file.length - path.extname(file).length
            //                 )
            //             )
            //             .split(path.sep)
            //             .join("/"),
            //         // This expands the relative paths to absolute paths, so e.g.
            //         // src/nested/foo.js becomes /project/src/nested/foo.js
            //         path.resolve(file),
            //     ])
            // )},
            // output: {
            //     dir: 'dist',
            //     format: 'esm',
            // }, 
        },
    },
});
