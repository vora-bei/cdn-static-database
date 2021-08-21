// eslint-disable-next-line no-undef
const { NODE_ENV } = process.env;

export const presets = [
  '@babel/typescript',
  [
    '@babel/env',
    {
      targets: {
        browsers: ['ie >= 11'],
      },
      exclude: ['transform-async-to-generator', 'transform-regenerator'],
      modules: false,
      loose: true,
    },
  ],
];
export const plugins = [
  // don't use `loose` mode here - need to copy symbols when spreading
  // '@babel/proposal-object-rest-spread',
  NODE_ENV === 'test' && '@babel/transform-modules-commonjs',
].filter(Boolean);
