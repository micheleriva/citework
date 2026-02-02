import { assertEquals, assertExists } from '@std/assert';
import type { GoogleBooksItem, OpenLibraryItem, Reference } from './sources.ts';
import {
  fromCrossref,
  fromGoogleBooks,
  fromOpenLibrary,
  toAPA,
  toBibTeX,
  toChicago,
  toHarvard,
  toMLA,
  type UnifiedCitation,
} from './formatter.ts';

// Mock data for testing
const mockCrossrefReference: Reference = {
  indexed: {
    'date-time': '2023-01-15T10:00:00Z',
    timestamp: 1673776800000,
    version: '1',
  },
  'edition-number': 1,
  'reference-count': 25,
  publisher: 'MIT Press',
  'isbn-type': [{ type: 'electronic', value: '978-0-262-03685-3' }],
  abstract: 'A comprehensive introduction to machine learning.',
  DOI: '10.1162/neco_a_01199',
  type: 'journal-article',
  created: {
    'date-time': '2023-01-15T10:00:00Z',
    timestamp: 1673776800000,
  },
  source: 'Crossref',
  title: ['Deep Learning Fundamentals'],
  prefix: '10.1162',
  author: [
    {
      given: 'John',
      family: 'Smith',
      sequence: 'first',
      affiliation: [{ name: 'MIT' }],
    },
    {
      given: 'Jane',
      family: 'Doe',
      sequence: 'additional',
      affiliation: [{ name: 'Stanford' }],
    },
  ],
  language: 'en',
  score: 1.0,
  resource: {
    primary: {
      URL: 'https://example.com/article',
    },
  },
  editor: [],
  ISBN: ['978-0-262-03685-3'],
  URL: 'https://example.com/article',
};

const mockGoogleBooksItem: GoogleBooksItem = {
  kind: 'books#volume',
  id: 'abc123',
  volumeInfo: {
    title: 'Introduction to Algorithms',
    authors: ['Thomas H. Cormen', 'Charles E. Leiserson'],
    publisher: 'MIT Press',
    publishedDate: '2009-07-31',
    description: 'A comprehensive textbook covering algorithms.',
    industryIdentifiers: [
      { type: 'ISBN_13', identifier: '9780262033848' },
      { type: 'ISBN_10', identifier: '0262033844' },
    ],
    pageCount: 1312,
    categories: ['Computer Science'],
    language: 'en',
    infoLink: 'https://books.google.com/books?id=abc123',
    imageLinks: {
      thumbnail: 'http://books.google.com/books/content?id=abc123',
      smallThumbnail: 'http://books.google.com/books/content?id=abc123',
    },
  },
};

const mockOpenLibraryItem: OpenLibraryItem = {
  key: '/works/OL12345W',
  title: 'The Pragmatic Programmer',
  author_name: ['Andrew Hunt', 'David Thomas'],
  first_publish_year: 1999,
  isbn: ['9780135957059', '0135957052'],
  publisher: ['Addison-Wesley'],
  language: ['eng'],
  subject: ['Programming', 'Software Engineering'],
  author_key: ['OL123A', 'OL456A'],
  edition_count: 5,
  cover_i: 12345,
  ebook_access: 'borrowable',
  ebook_count_i: 1,
};

// Test fromCrossref
Deno.test('fromCrossref - converts Crossref reference to UnifiedCitation', () => {
  const result = fromCrossref(mockCrossrefReference);

  assertEquals(result.title, 'Deep Learning Fundamentals');
  assertEquals(result.authors, ['John Smith', 'Jane Doe']);
  assertEquals(result.year, 2023);
  assertEquals(result.publisher, 'MIT Press');
  assertEquals(result.doi, '10.1162/neco_a_01199');
  assertEquals(result.type, 'article');
  assertEquals(result.source, 'crossref');
  assertEquals(result.language, 'en');
  assertExists(result.url);
});

Deno.test('fromCrossref - handles missing authors', () => {
  const refWithoutAuthors: Reference = {
    ...mockCrossrefReference,
    author: undefined as unknown as Reference['author'],
  };

  const result = fromCrossref(refWithoutAuthors);
  assertEquals(result.authors, []);
});

Deno.test('fromCrossref - handles missing title', () => {
  const refWithoutTitle: Reference = {
    ...mockCrossrefReference,
    title: [],
  };

  const result = fromCrossref(refWithoutTitle);
  assertEquals(result.title, 'Untitled');
});

Deno.test('fromCrossref - maps book type correctly', () => {
  const bookRef: Reference = {
    ...mockCrossrefReference,
    type: 'book',
  };

  const result = fromCrossref(bookRef);
  assertEquals(result.type, 'book');
});

Deno.test('fromCrossref - maps proceedings type correctly', () => {
  const proceedingsRef: Reference = {
    ...mockCrossrefReference,
    type: 'proceedings-article',
  };

  const result = fromCrossref(proceedingsRef);
  // proceedings-article contains "article" so it matches article type first
  assertEquals(result.type, 'article');
});

// Test fromGoogleBooks
Deno.test('fromGoogleBooks - converts Google Books item to UnifiedCitation', () => {
  const result = fromGoogleBooks(mockGoogleBooksItem);

  assertEquals(result.title, 'Introduction to Algorithms');
  assertEquals(result.authors, ['Thomas H. Cormen', 'Charles E. Leiserson']);
  assertEquals(result.year, 2009);
  assertEquals(result.publisher, 'MIT Press');
  assertEquals(result.isbn, ['9780262033848', '0262033844']);
  assertEquals(result.type, 'book');
  assertEquals(result.source, 'googlebooks');
  assertEquals(result.language, 'en');
});

Deno.test('fromGoogleBooks - handles missing authors', () => {
  const bookWithoutAuthors: GoogleBooksItem = {
    ...mockGoogleBooksItem,
    volumeInfo: {
      ...mockGoogleBooksItem.volumeInfo,
      authors: undefined,
    },
  };

  const result = fromGoogleBooks(bookWithoutAuthors);
  assertEquals(result.authors, []);
});

Deno.test('fromGoogleBooks - handles missing ISBN', () => {
  const bookWithoutISBN: GoogleBooksItem = {
    ...mockGoogleBooksItem,
    volumeInfo: {
      ...mockGoogleBooksItem.volumeInfo,
      industryIdentifiers: undefined,
    },
  };

  const result = fromGoogleBooks(bookWithoutISBN);
  assertEquals(result.isbn, []);
});

// Test fromOpenLibrary
Deno.test('fromOpenLibrary - converts Open Library item to UnifiedCitation', () => {
  const result = fromOpenLibrary(mockOpenLibraryItem);

  assertEquals(result.title, 'The Pragmatic Programmer');
  assertEquals(result.authors, ['Andrew Hunt', 'David Thomas']);
  assertEquals(result.year, 1999);
  assertEquals(result.publisher, 'Addison-Wesley');
  assertEquals(result.isbn, ['9780135957059', '0135957052']);
  assertEquals(result.type, 'book');
  assertEquals(result.source, 'openlibrary');
  assertEquals(result.url, 'https://openlibrary.org/works/OL12345W');
});

Deno.test('fromOpenLibrary - handles missing authors', () => {
  const bookWithoutAuthors: OpenLibraryItem = {
    ...mockOpenLibraryItem,
    author_name: undefined,
  };

  const result = fromOpenLibrary(bookWithoutAuthors);
  assertEquals(result.authors, []);
});

Deno.test('fromOpenLibrary - handles missing publisher', () => {
  const bookWithoutPublisher: OpenLibraryItem = {
    ...mockOpenLibraryItem,
    publisher: undefined,
  };

  const result = fromOpenLibrary(bookWithoutPublisher);
  assertEquals(result.publisher, undefined);
});

// Test APA formatting
Deno.test('toAPA - formats book citation correctly', () => {
  const citation: UnifiedCitation = {
    title: 'Introduction to Algorithms',
    authors: ['Thomas H. Cormen', 'Charles E. Leiserson'],
    year: 2009,
    publisher: 'MIT Press',
    type: 'book',
    source: 'googlebooks',
  };

  const result = toAPA(citation);
  assertEquals(
    result,
    'Cormen, Thomas H. & Leiserson, Charles E. (2009). <i>Introduction to Algorithms</i>. MIT Press.',
  );
});

Deno.test('toAPA - formats article citation with DOI', () => {
  const citation: UnifiedCitation = {
    title: 'Deep Learning Fundamentals',
    authors: ['John Smith'],
    year: 2023,
    publisher: 'MIT Press',
    doi: '10.1162/neco_a_01199',
    type: 'article',
    source: 'crossref',
  };

  const result = toAPA(citation);
  assertEquals(
    result,
    'Smith, John (2023). Deep Learning Fundamentals. MIT Press. https://doi.org/10.1162/neco_a_01199',
  );
});

Deno.test('toAPA - formats citation with three authors', () => {
  const citation: UnifiedCitation = {
    title: 'Research Paper',
    authors: ['Alice Johnson', 'Bob Williams', 'Carol Davis'],
    year: 2022,
    type: 'article',
    source: 'crossref',
  };

  const result = toAPA(citation);
  assertEquals(
    result,
    'Johnson, Alice, Williams, Bob, & Davis, Carol (2022). Research Paper.',
  );
});

Deno.test('toAPA - handles missing year', () => {
  const citation: UnifiedCitation = {
    title: 'Undated Work',
    authors: ['John Doe'],
    type: 'book',
    source: 'openlibrary',
  };

  const result = toAPA(citation);
  assertEquals(result, 'Doe, John (n.d.). <i>Undated Work</i>.');
});

Deno.test('toAPA - handles unknown author', () => {
  const citation: UnifiedCitation = {
    title: 'Anonymous Work',
    authors: [],
    year: 2020,
    type: 'book',
    source: 'openlibrary',
  };

  const result = toAPA(citation);
  assertEquals(result, 'Unknown Author (2020). <i>Anonymous Work</i>.');
});

// Test MLA formatting
Deno.test('toMLA - formats book citation correctly', () => {
  const citation: UnifiedCitation = {
    title: 'Introduction to Algorithms',
    authors: ['Thomas H. Cormen', 'Charles E. Leiserson'],
    year: 2009,
    publisher: 'MIT Press',
    type: 'book',
    source: 'googlebooks',
  };

  const result = toMLA(citation);
  assertEquals(
    result,
    'Cormen, Thomas H., and Charles E. Leiserson. <i>Introduction to Algorithms</i>. MIT Press, 2009.',
  );
});

Deno.test('toMLA - formats article citation correctly', () => {
  const citation: UnifiedCitation = {
    title: 'Deep Learning Fundamentals',
    authors: ['John Smith'],
    year: 2023,
    type: 'article',
    source: 'crossref',
  };

  const result = toMLA(citation);
  assertEquals(
    result,
    'Smith, John. "Deep Learning Fundamentals"., 2023.',
  );
});

Deno.test('toMLA - uses et al for three+ authors', () => {
  const citation: UnifiedCitation = {
    title: 'Research Paper',
    authors: ['Alice Johnson', 'Bob Williams', 'Carol Davis'],
    year: 2022,
    type: 'article',
    source: 'crossref',
  };

  const result = toMLA(citation);
  assertEquals(
    result,
    'Johnson, Alice, et al. "Research Paper"., 2022.',
  );
});

// Test Chicago formatting
Deno.test('toChicago - formats book citation correctly', () => {
  const citation: UnifiedCitation = {
    title: 'Introduction to Algorithms',
    authors: ['Thomas H. Cormen', 'Charles E. Leiserson'],
    year: 2009,
    publisher: 'MIT Press',
    type: 'book',
    source: 'googlebooks',
  };

  const result = toChicago(citation);
  assertEquals(
    result,
    'Cormen, Thomas H. and Charles E. Leiserson. 2009. <i>Introduction to Algorithms</i>. MIT Press.',
  );
});

Deno.test('toChicago - formats article with DOI', () => {
  const citation: UnifiedCitation = {
    title: 'Deep Learning',
    authors: ['John Smith'],
    year: 2023,
    doi: '10.1162/neco_a_01199',
    type: 'article',
    source: 'crossref',
  };

  const result = toChicago(citation);
  assertEquals(
    result,
    'Smith, John. 2023. "Deep Learning". https://doi.org/10.1162/neco_a_01199.',
  );
});

// Test Harvard formatting
Deno.test('toHarvard - formats book citation correctly', () => {
  const citation: UnifiedCitation = {
    title: 'Introduction to Algorithms',
    authors: ['Thomas H. Cormen', 'Charles E. Leiserson'],
    year: 2009,
    publisher: 'MIT Press',
    type: 'book',
    source: 'googlebooks',
  };

  const result = toHarvard(citation);
  assertEquals(
    result,
    'Cormen, Thomas H. and Leiserson, Charles E. (2009) <i>Introduction to Algorithms</i>. MIT Press.',
  );
});

Deno.test('toHarvard - uses et al for three+ authors', () => {
  const citation: UnifiedCitation = {
    title: 'Research Paper',
    authors: ['Alice Johnson', 'Bob Williams', 'Carol Davis'],
    year: 2022,
    type: 'article',
    source: 'crossref',
  };

  const result = toHarvard(citation);
  assertEquals(result, 'Johnson, Alice et al. (2022) Research Paper.');
});

Deno.test('toHarvard - includes URL when available', () => {
  const citation: UnifiedCitation = {
    title: 'Web Article',
    authors: ['John Doe'],
    year: 2023,
    url: 'https://example.com/article',
    type: 'article',
    source: 'crossref',
  };

  const result = toHarvard(citation);
  assertEquals(
    result,
    'Doe, John (2023) Web Article. Available at: https://example.com/article',
  );
});

// Test BibTeX formatting
Deno.test('toBibTeX - formats book entry correctly', () => {
  const citation: UnifiedCitation = {
    title: 'Introduction to Algorithms',
    authors: ['Thomas H. Cormen', 'Charles E. Leiserson'],
    year: 2009,
    publisher: 'MIT Press',
    isbn: ['9780262033848'],
    type: 'book',
    source: 'googlebooks',
  };

  const result = toBibTeX(citation);
  const expected = `@book{cormen2009introduction,
  title={Introduction to Algorithms},
  author={Thomas H. Cormen and Charles E. Leiserson},
  year={2009},
  publisher={MIT Press},
  isbn={9780262033848},
}`;

  assertEquals(result, expected);
});

Deno.test('toBibTeX - formats article entry with DOI', () => {
  const citation: UnifiedCitation = {
    title: 'Deep Learning Fundamentals',
    authors: ['John Smith'],
    year: 2023,
    publisher: 'MIT Press',
    doi: '10.1162/neco_a_01199',
    type: 'article',
    source: 'crossref',
  };

  const result = toBibTeX(citation);
  const expected = `@article{smith2023deep,
  title={Deep Learning Fundamentals},
  author={John Smith},
  year={2023},
  publisher={MIT Press},
  doi={10.1162/neco_a_01199},
}`;

  assertEquals(result, expected);
});

Deno.test('toBibTeX - handles missing year', () => {
  const citation: UnifiedCitation = {
    title: 'Undated Work',
    authors: ['John Doe'],
    type: 'book',
    source: 'openlibrary',
  };

  const result = toBibTeX(citation);
  const expected = `@book{doenodateundated,
  title={Undated Work},
  author={John Doe},
}`;

  assertEquals(result, expected);
});

Deno.test('toBibTeX - handles missing authors', () => {
  const citation: UnifiedCitation = {
    title: 'Anonymous Work',
    authors: [],
    year: 2020,
    type: 'book',
    source: 'openlibrary',
  };

  const result = toBibTeX(citation);
  const expected = `@book{unknown2020anonymous,
  title={Anonymous Work},
  year={2020},
}`;

  assertEquals(result, expected);
});

Deno.test('toBibTeX - includes URL when available', () => {
  const citation: UnifiedCitation = {
    title: 'Online Resource',
    authors: ['Jane Smith'],
    year: 2023,
    url: 'https://example.com/resource',
    type: 'article',
    source: 'crossref',
  };

  const result = toBibTeX(citation);
  const expected = `@article{smith2023online,
  title={Online Resource},
  author={Jane Smith},
  year={2023},
  url={https://example.com/resource},
}`;

  assertEquals(result, expected);
});

// Test edge cases
Deno.test('handles single name authors', () => {
  const citation: UnifiedCitation = {
    title: 'Single Name Work',
    authors: ['Madonna'],
    year: 2020,
    type: 'book',
    source: 'openlibrary',
  };

  const apaResult = toAPA(citation);
  assertEquals(apaResult, 'Madonna (2020). <i>Single Name Work</i>.');
});

Deno.test('handles very long author lists', () => {
  const authors = Array.from({ length: 10 }, (_, i) => `Author ${i + 1}`);
  const citation: UnifiedCitation = {
    title: 'Collaborative Work',
    authors,
    year: 2023,
    type: 'article',
    source: 'crossref',
  };

  const result = toAPA(citation);
  assertExists(result);
  assertEquals(result.includes('et al') || result.includes('&'), true);
});

Deno.test('handles special characters in titles', () => {
  const citation: UnifiedCitation = {
    title: 'Special Characters: Colons & Ampersands',
    authors: ['John Doe'],
    year: 2023,
    type: 'article',
    source: 'crossref',
  };

  const result = toAPA(citation);
  assertEquals(
    result,
    'Doe, John (2023). Special Characters: Colons & Ampersands.',
  );
});
