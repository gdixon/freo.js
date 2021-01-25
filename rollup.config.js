// transpile the builds into es5 compatible versions
import babel from '@rollup/plugin-babel';

// allow for external dependencies to rollup with bundle
import nodeResolve from '@rollup/plugin-node-resolve';

// minify the the builds
import terser from "rollup-plugin-terser";

// browser bundle to include everything
const iifeBuild = {
    // externalise Fre - inorder to load @gdixon/freo/freo.bundle.js we would first need to load @gdixon/fre/fre.bundle.js
    external: [
        '@gdixon/fre', 
        '@gdixon/fre/operator',
        '@gdixon/fre/scheduler'
    ],
    input: './src/freo.js',
    output: {
        file: './dist/freo.bundle.js',
        format: 'iife',
        name: 'Freo',
        globals: {
            '@gdixon/fre': 'Fre',
            '@gdixon/fre/operator': 'Fre',
            '@gdixon/fre/scheduler': 'Fre'
        }
    },
    plugins: [
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled'
        }),
        terser.terser()
    ]
};

// browser bundle to include everything
const iifeBuild2 = {
    // externalise Fre - inorder to load @gdixon/freo/freo.bundle.js we would first need to load @gdixon/fre/fre.bundle.js
    external: [
        '@gdixon/fre', 
        '@gdixon/fre/operator',
        '@gdixon/fre/scheduler'
    ],
    input: './src/index.js',
    output: {
        file: './dist/freo.core.bundle.js',
        format: 'iife',
        name: 'Freo',
        globals: {
            '@gdixon/fre': 'Fre',
            '@gdixon/fre/operator': 'Fre',
            '@gdixon/fre/scheduler': 'Fre'
        }
    },
    plugins: [
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled'
        }),
        terser.terser()
    ]
};

// browser bundle to include everything
const iifeBuild3 = {
    // externalise Fre - inorder to load @gdixon/freo/freo.bundle.js we would first need to load @gdixon/fre/fre.bundle.js
    external: [
        '@gdixon/fre', 
        '@gdixon/fre/operator',
        '@gdixon/fre/scheduler'
    ],
    input: './src/adapter/index.js',
    output: {
        file: './dist/freo.adapter.bundle.js',
        format: 'iife',
        name: 'Freo',
        globals: {
            '@gdixon/fre': 'Fre',
            '@gdixon/fre/operator': 'Fre',
            '@gdixon/fre/scheduler': 'Fre'
        }
    },
    plugins: [
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled'
        }),
        terser.terser()
    ]
};


// browser bundle to include everything
const iifeBuild4 = {
    // externalise Fre - inorder to load @gdixon/freo/freo.bundle.js we would first need to load @gdixon/fre/fre.bundle.js
    external: [
        '@gdixon/fre', 
        '@gdixon/fre/operator',
        '@gdixon/fre/scheduler'
    ],
    input: './src/utility/index.js',
    output: {
        file: './dist/freo.utility.bundle.js',
        format: 'iife',
        name: 'Freo',
        globals: {
            '@gdixon/fre': 'Fre',
            '@gdixon/fre/operator': 'Fre',
            '@gdixon/fre/scheduler': 'Fre'
        }
    },
    plugins: [
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled'
        }),
        terser.terser()
    ]
};

// ServiceWorker bundle to include Freo and third-party (@gdixon/fre/subscription) dependencies
const workerBuild = {
    input: './src/internal/adapter/sync/worker.js',
    output: {
        file: './dist/worker.js',
        format: 'iife'
    },
    plugins: [
        nodeResolve(),
        babel({
            babelHelpers: 'bundled'
        })
    ]
};

// only iife bundle to be built by rollup everything else will be handled by tools/make-esmodules
export default [
    iifeBuild,
    iifeBuild2,
    iifeBuild3,
    iifeBuild4,
    workerBuild
];