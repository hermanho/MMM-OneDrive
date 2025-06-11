import banner2 from 'rollup-plugin-banner2';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const bannerText = `/*! *****************************************************************************
  ${pkg.name}
  Version ${pkg.version}

  ${pkg.description}
  Please submit bugs at ${pkg.bugs.url}

  (c) ${pkg.author ? pkg.author : pkg.contributors}
  Licence: ${pkg.license}

  This file is auto-generated. Do not edit.
***************************************************************************** */

`;
export default [
  {
    input: 'src/frontend/main.ts',
    external: ['logger', 'moment'],
    plugins: [typescript({ module: 'ESNext', include: ['src/**', 'types/**'] }), nodeResolve(), commonjs(), terser(), banner2(() => bannerText)],
    output: {
      file: `./${pkg.main}`,
      format: 'iife',
      sourcemap: true,
      globals: {
        logger: 'Log',
        moment: 'moment',
      },
    },
  },
];