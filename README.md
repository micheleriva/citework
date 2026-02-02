# Citework

A comprehensive JavaScript library for academic citation management with multi-source API integration and support for
multiple citation formats.

## Features

- **Multi-Source Reference Search**: Query Crossref, Google Books, and Open Library APIs
- **Multiple Citation Formats**: APA, MLA, Chicago, Harvard, and BibTeX
- **Unified Citation Format**: Convert from any source to a standardized format
- **Pagination Support**: Efficient pagination for all API sources
- **Comprehensive Testing**: 32 unit tests + 18 E2E tests
- **Type-Safe**: Full TypeScript support with detailed type definitions

## Installation

```bash
npm i citework
```

## Quick Start

### 1. Search for Academic Papers (Crossref)

```typescript
import type { GetReference } from 'citework';
import { fromCrossref, toAPA } from 'citework';

// Search Crossref for academic papers
const results = await GetReference.fromTitle(
  'Machine Learning',
  'your.email@example.com',
  { rows: 5, offset: 0 },
);

console.log(`Found ${results.message['total-results']} results`);

// Convert first result to APA format
const citation = fromCrossref(results.message.items[0]);
const apa = toAPA(citation);
console.log(apa);
```

**Output:**

```
Found 125847 results
LeCun, Yann, Bengio, Yoshua, & Hinton, Geoffrey (2015). Deep learning. Nature. https://doi.org/10.1038/nature14539
```

The Crossref API requires an email address to access their _"polite pool"_ of servers, which offers:

- **Higher rate limits**: 50 requests/second vs 10/second for anonymous users
- **Better performance**: Dedicated infrastructure for identified users
- **Usage tracking**: Helps Crossref understand API usage patterns

Your email is only sent as a URL parameter (`mailto`) to Crossref and is never stored by this library. It's a
requirement from Crossref to promote responsible API usage and enable them to contact users if needed.

### 2. Search for Books (Google Books)

```typescript
import { GetReference } from 'citework';
import { fromGoogleBooks, toMLA } from 'citework';

// Search Google Books
const books = await GetReference.fromTitleGoogleBooks(
  'Introduction to Algorithms',
  { maxResults: 3 },
);

console.log(`Found ${books.totalItems} books`);

// Format in MLA style
books.items.forEach((book) => {
  const citation = fromGoogleBooks(book);
  console.log(toMLA(citation));
});
```

**Output:**

```
Found 1247 books
Cormen, Thomas H., and Charles E. Leiserson. <i>Introduction to Algorithms</i>. MIT Press, 2009.
```

### 3. Search Open Library

```typescript
import { GetReference } from 'citework';
import { fromOpenLibrary, toChicago } from 'citework';

// Search Open Library
const results = await GetReference.fromTitleOpenLibrary(
  'The Great Gatsby',
  { limit: 5 },
);

console.log(`Found ${results.numFound} results`);

// Format in Chicago style
const citation = fromOpenLibrary(results.docs[0]);
console.log(toChicago(citation));
```

**Output:**

```
Found 892 results
Fitzgerald, F. Scott. 1925. <i>The Great Gatsby</i>. Scribner. https://openlibrary.org/works/OL468431W.
```

### 4. Search All Sources Simultaneously

```typescript
import { GetReference } from 'citework';

// Query all three sources at once
const results = await GetReference.fromTitleAllSources(
  'Artificial Intelligence',
  'your.email@example.com',
  {
    crossref: { rows: 5 },
    googleBooks: { maxResults: 5 },
    openLibrary: { limit: 5 },
  },
);

// Access results from each source
if (results.crossref) {
  console.log(`Crossref: ${results.crossref.message.items.length} papers`);
}
if (results.googleBooks) {
  console.log(`Google Books: ${results.googleBooks.items.length} books`);
}
if (results.openLibrary) {
  console.log(`Open Library: ${results.openLibrary.docs.length} books`);
}
```

**Output:**

```
Crossref: 5 papers
Google Books: 5 books
Open Library: 5 books
```

## Citation Format Examples

Using the same source data, here's how each citation style formats the output:

### Source Data

```typescript
const citation: UnifiedCitation = {
  title: 'Introduction to Algorithms',
  authors: ['Thomas H. Cormen', 'Charles E. Leiserson'],
  year: 2009,
  publisher: 'MIT Press',
  isbn: ['9780262033848'],
  type: 'book',
  source: 'googlebooks',
};
```

### APA Format

```typescript
console.log(toAPA(citation));
```

**Output:**

```
Cormen, Thomas H. & Leiserson, Charles E. (2009). <i>Introduction to Algorithms</i>. MIT Press.
```

### MLA Format

```typescript
console.log(toMLA(citation));
```

**Output:**

```
Cormen, Thomas H., and Charles E. Leiserson. <i>Introduction to Algorithms</i>. MIT Press, 2009.
```

### Chicago Format

```typescript
console.log(toChicago(citation));
```

**Output:**

```
Cormen, Thomas H. and Charles E. Leiserson. 2009. <i>Introduction to Algorithms</i>. MIT Press.
```

### Harvard Format

```typescript
console.log(toHarvard(citation));
```

**Output:**

```
Cormen, Thomas H. and Leiserson, Charles E. (2009) <i>Introduction to Algorithms</i>. MIT Press.
```

### BibTeX Format

```typescript
console.log(toBibTeX(citation));
```

**Output:**

```bibtex
@book{cormen2009introduction,
  title={Introduction to Algorithms},
  author={Thomas H. Cormen and Charles E. Leiserson},
  year={2009},
  publisher={MIT Press},
  isbn={9780262033848},
}
```

## API Reference

### Sources API (`sources.ts`)

#### `GetReference.fromTitle(title, email, options?)`

Search Crossref for academic papers and journals.

**Parameters:**

- `title` (string): Search query
- `email` (string): Your email (required by Crossref for polite API usage)
- `options` (optional):
  - `rows`: Number of results (default: 20)
  - `offset`: Starting position for pagination

**Returns:** `Promise<ReferencesSearchResponse>`

#### `GetReference.fromTitleGoogleBooks(title, options?)`

Search Google Books for books.

**Parameters:**

- `title` (string): Search query
- `options` (optional):
  - `maxResults`: Number of results (default: 10, max: 40)
  - `startIndex`: Starting position for pagination

**Returns:** `Promise<GoogleBooksResponse>`

#### `GetReference.fromTitleOpenLibrary(title, options?)`

Search Open Library for books.

**Parameters:**

- `title` (string): Search query
- `options` (optional):
  - `limit`: Number of results
  - `offset`: Starting position for pagination

**Returns:** `Promise<OpenLibraryResponse>`

#### `GetReference.fromTitleAllSources(title, email, options?)`

Search all three sources simultaneously.

**Parameters:**

- `title` (string): Search query
- `email` (string): Your email for Crossref
- `options` (optional): Object with pagination options for each source

**Returns:** Object with optional results from each source

### Formatter API (`formatter.ts`)

#### Converter Functions

- `fromCrossref(reference: Reference): UnifiedCitation`
- `fromGoogleBooks(book: GoogleBooksItem): UnifiedCitation`
- `fromOpenLibrary(book: OpenLibraryItem): UnifiedCitation`

#### Formatter Functions

- `toAPA(citation: UnifiedCitation): string`
- `toMLA(citation: UnifiedCitation): string`
- `toChicago(citation: UnifiedCitation): string`
- `toHarvard(citation: UnifiedCitation): string`
- `toBibTeX(citation: UnifiedCitation): string`

## Complete Example

Here's a complete example that searches multiple sources and formats citations:

```typescript
import { GetReference } from 'citework';
import { fromCrossref, fromGoogleBooks, fromOpenLibrary, toAPA, toBibTeX, toMLA } from 'citework';

async function searchAndFormat(query: string) {
  console.log(`Searching for: "${query}"\n`);

  // Search all sources
  const results = await GetReference.fromTitleAllSources(
    query,
    'researcher@university.edu',
    {
      crossref: { rows: 2 },
      googleBooks: { maxResults: 2 },
      openLibrary: { limit: 2 },
    },
  );

  // Process Crossref results
  if (results.crossref) {
    console.log('=== Academic Papers (Crossref) ===');
    results.crossref.message.items.forEach((item, i) => {
      const citation = fromCrossref(item);
      console.log(`\n${i + 1}. APA Format:`);
      console.log(toAPA(citation));
      console.log(`\n   BibTeX:`);
      console.log(toBibTeX(citation));
    });
  }

  // Process Google Books results
  if (results.googleBooks) {
    console.log('\n=== Books (Google Books) ===');
    results.googleBooks.items.forEach((item, i) => {
      const citation = fromGoogleBooks(item);
      console.log(`\n${i + 1}. MLA Format:`);
      console.log(toMLA(citation));
    });
  }

  // Process Open Library results
  if (results.openLibrary) {
    console.log('\n=== Books (Open Library) ===');
    results.openLibrary.docs.forEach((item, i) => {
      const citation = fromOpenLibrary(item);
      console.log(`\n${i + 1}. Chicago Format:`);
      console.log(toChicago(citation));
    });
  }
}

// Run the example
await searchAndFormat('Machine Learning');
```

**Sample Output:**

```
Searching for: "Machine Learning"

=== Academic Papers (Crossref) ===

1. APA Format:
Breiman, Leo (2001). Random Forests. Machine Learning. https://doi.org/10.1023/A:1010933404324

   BibTeX:
@article{breiman2001random,
  title={Random Forests},
  author={Leo Breiman},
  year={2001},
  publisher={Machine Learning},
  doi={10.1023/A:1010933404324},
}

2. APA Format:
Bishop, Christopher M. (2006). Pattern Recognition and Machine Learning. Springer.

   BibTeX:
@article{bishop2006pattern,
  title={Pattern Recognition and Machine Learning},
  author={Christopher M. Bishop},
  year={2006},
  publisher={Springer},
}

=== Books (Google Books) ===

1. MLA Format:
Murphy, Kevin P. <i>Machine Learning: A Probabilistic Perspective</i>. MIT Press, 2012.

2. MLA Format:
Goodfellow, Ian, et al. <i>Deep Learning</i>. MIT Press, 2016.

=== Books (Open Library) ===

1. Chicago Format:
Russell, Stuart J. and Norvig, Peter. 2010. <i>Artificial Intelligence: A Modern Approach</i>. Prentice Hall.

2. Chicago Format:
Hastie, Trevor, Tibshirani, Robert, and Friedman, Jerome. 2009. <i>The Elements of Statistical Learning</i>. Springer.
```

## API Rate Limits

Be aware of API rate limits:

- **Crossref**: 50 requests/second (polite pool with email)
- **Google Books**: 20M queries/day
- **Open Library**: Generally permissive but may throttle

The library handles errors gracefully when APIs are rate-limited or unavailable.

## Building for npm

This project is written in Deno but can be published to npm. To build the npm package:

```bash
# Build with default version (0.1.0)
deno task build:npm

# Build with specific version
deno task build:npm 1.0.0
```

The built package will be in the `npm/` directory. To publish:

```bash
cd npm
npm publish
```

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass: `deno task test:all`
2. Code follows the existing style
3. New features include tests

## License

[MIT License](LICENSE.md)

## Acknowledgments

- [Crossref API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
- [Google Books API](https://developers.google.com/books)
- [Open Library API](https://openlibrary.org/developers/api)
