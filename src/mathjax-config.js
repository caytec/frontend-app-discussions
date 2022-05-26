const config = {
  loader: { load: ['[tex]/html'] },
  tex: {
    packages: { '[+]': ['html'] },
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
      ['[mathjaxinline]', '[/mathjaxinline]'],
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
      ['[mathjax]', '[/mathjax]'],
    ],
  },
  startup: {
    typeset: false,
  },
};
export default config;
