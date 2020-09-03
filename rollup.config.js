import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'

export default {
    input: 'src/index.js',
    plugins: [
        nodeResolve(),
        commonjs(),
    ],
    external: ['os','fs', 'path','postcss',
    'postcss-advanced-variables', 'postcss-atroot',
    'postcss-extend-rule', 'postcss-nested',
    'postcss-property-lookup', 'postcss-color-mod-function',
    'resolve'],
    output: [
        {
            exports: 'auto',
            file: 'lib/index.cjs.js',
            format: 'cjs'
        },
        {
            file: 'lib/index.esm.js',
            format: 'esm'
        }
    ]
}