import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

import pkg from './package.json';

const extensions = ['.js', '.ts', '.mjs', '.json', '.node'];
const noDeclarationFiles = { compilerOptions: { declaration: false } };

const babelRuntimeVersion = pkg.dependencies['@babel/runtime'].replace(/^[^0-9]*/, '');

const makeExternalPredicate = externalArr => {
  if (externalArr.length === 0) {
    return () => false;
  }
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`);
  return id => pattern.test(id);
};

export default [
  // CommonJS
  {
    input: 'src/index.ts',
    output: { file: 'lib/cdn-static-database.js', format: 'cjs', indent: false },
    external: makeExternalPredicate([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ]),
    plugins: [
      nodeResolve({
        extensions,
      }),
      typescript({ useTsconfigDeclarationDir: true }),
      babel({
        extensions,
        plugins: [['@babel/plugin-transform-runtime', { version: babelRuntimeVersion }]],
        babelHelpers: 'runtime',
      }),
    ],
  },

  // ES
  {
    input: 'src/index.ts',
    output: { file: 'es/cdn-static-database.js', format: 'es', indent: false },
    external: makeExternalPredicate([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ]),
    plugins: [
      nodeResolve({
        extensions,
      }),
      typescript({ tsconfigOverride: noDeclarationFiles }),
      babel({
        extensions,
        plugins: [['@babel/plugin-transform-runtime', { version: babelRuntimeVersion, useESModules: true }]],
        babelHelpers: 'runtime',
      }),
    ],
  },
  // ES for Browsers
  {
    input: 'src/index.ts',
    output: {
      file: 'es/cdn-static-database.mjs',
      format: 'es',
      indent: false,
      globals: {
        'mingo/util': 'mingo/util',
      },
    },
    external: ['mingo/util'],
    plugins: [
      nodePolyfills(),
      nodeResolve({
        extensions,
      }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      typescript({ tsconfigOverride: noDeclarationFiles }),
      commonjs(),
      babel({
        extensions,
        exclude: 'node_modules/**',
        plugins: [],
        babelHelpers: 'bundled',
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
      }),
    ],
  },
  // UMD Development
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cdn-static-database.js',
      format: 'umd',
      name: 'cdn-static-database',
      indent: false,
      globals: {
        'mingo/util': 'mingo/util',
      },
    },
    external: ['mingo/util'],
    plugins: [
      nodeResolve({
        extensions,
      }),
      typescript({ tsconfigOverride: noDeclarationFiles }),
      commonjs(),
      babel({
        extensions,
        exclude: 'node_modules/**',
        plugins: [],
        babelHelpers: 'bundled',
      }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('development'),
      }),
    ],
  },

  // UMD Production
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cdn-static-database.min.js',
      format: 'umd',
      name: 'cdn-static-database',
      indent: false,
      globals: {
        'mingo/util': 'mingo/util',
      },
    },
    external: ['mingo/util'],
    plugins: [
      nodeResolve({
        extensions,
      }),
      typescript({ tsconfigOverride: noDeclarationFiles }),
      commonjs(),
      babel({
        extensions,
        exclude: 'node_modules/**',
        plugins: [],
        babelHelpers: 'bundled',
      }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
      }),
    ],
  },
];
