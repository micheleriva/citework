import { build, emptyDir } from 'https://deno.land/x/dnt@0.41.1/mod.ts';

await emptyDir('./npm');

await build({
  entryPoints: [
    {
      name: '.',
      path: './mod.ts',
    },
  ],
  outDir: './npm',
  shims: {
    deno: true,
  },
  test: false, // Skip running tests during build (they require network access)
  typeCheck: 'both',
  compilerOptions: {
    lib: ['ES2021', 'DOM'],
  },
  package: {
    name: 'citework',
    version: Deno.args[0] || '0.1.0',
    description:
      'A comprehensive JavaScript library for academic citation management with multi-source API integration and support for multiple citation formats.',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/yourusername/citework.git',
    },
    bugs: {
      url: 'https://github.com/yourusername/citework/issues',
    },
    keywords: [
      'citation',
      'academic',
      'bibliography',
      'crossref',
      'google-books',
      'open-library',
      'apa',
      'mla',
      'chicago',
      'harvard',
      'bibtex',
      'references',
      'research',
    ],
    engines: {
      node: '>=18.0.0',
    },
  },
  postBuild() {
    // Copy README and LICENSE to npm directory
    Deno.copyFileSync('README.md', 'npm/README.md');

    // Copy LICENSE if it exists
    try {
      Deno.copyFileSync('LICENSE.md', 'npm/LICENSE.md');
    } catch {
      console.log('No LICENSE.md file found, skipping...');
    }
  },
});

console.log('\nBuild complete!');
console.log('\nTo publish to npm:');
console.log('  cd npm');
console.log('  npm publish');
