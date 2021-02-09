import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'
import {terser} from 'rollup-plugin-terser'
import {nodeResolve} from '@rollup/plugin-node-resolve'

export default [{
  input: 'src/index.ts',
  external: ['tslib'],
  output: {
    dir: 'lib',
    entryFileNames: '[name]' + pkg.main.replace('index', ''),
    format: 'cjs'
  },
  plugins: [
    typescript(),
    nodeResolve(),
  ]
}, {
  input: 'src/index.ts',
  external: ['tslib'],
  output: {
    dir: 'lib',
    entryFileNames: '[name]' + pkg.module.replace('index', ''),
    format: 'es'
  },
  plugins: [
    nodeResolve(),
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          target: 'es6',
        }
      }
    }),
  ]
}, {
  input: 'src/index.ts',
  external: ['tslib'],
  output: {
    file: 'lib/innet-for.min.js',
    format: 'iife',
    name: 'innetFor',
    plugins: [terser()]
  },
  plugins: [
    typescript(),
  ]
}]
