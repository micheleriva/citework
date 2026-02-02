import type { GoogleBooksItem, OpenLibraryItem, Reference } from './sources.ts';

export type UnifiedCitation = {
  title: string;
  authors: string[];
  year?: number;
  publisher?: string;
  doi?: string;
  isbn?: string[];
  url?: string;
  abstract?: string;
  type: 'book' | 'article' | 'paper' | 'unknown';
  source: 'crossref' | 'googlebooks' | 'openlibrary';
  language?: string;
};

function mapCrossrefType(
  type: string,
): 'book' | 'article' | 'paper' | 'unknown' {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('book')) return 'book';
  if (lowerType.includes('journal') || lowerType.includes('article')) {
    return 'article';
  }
  if (lowerType.includes('proceedings') || lowerType.includes('paper')) {
    return 'paper';
  }
  return 'unknown';
}

function formatAuthorLastFirst(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];

  const lastName = parts[parts.length - 1];
  const firstNames = parts.slice(0, -1).join(' ');
  return `${lastName}, ${firstNames}`;
}

function formatAuthorsAPA(authors: string[]): string {
  if (authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return formatAuthorLastFirst(authors[0]);
  if (authors.length === 2) {
    return `${formatAuthorLastFirst(authors[0])} & ${
      formatAuthorLastFirst(
        authors[1],
      )
    }`;
  }

  const formatted = authors
    .slice(0, -1)
    .map((a) => formatAuthorLastFirst(a));
  return `${formatted.join(', ')}, & ${
    formatAuthorLastFirst(
      authors[authors.length - 1],
    )
  }`;
}

function formatAuthorsMLA(authors: string[]): string {
  if (authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return formatAuthorLastFirst(authors[0]);
  if (authors.length === 2) {
    return `${formatAuthorLastFirst(authors[0])}, and ${authors[1]}`;
  }

  return `${formatAuthorLastFirst(authors[0])}, et al`;
}

function formatAuthorsChicago(authors: string[]): string {
  if (authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return formatAuthorLastFirst(authors[0]);
  if (authors.length === 2) {
    return `${formatAuthorLastFirst(authors[0])} and ${authors[1]}`;
  }

  const formatted = authors
    .slice(0, -1)
    .map((a) => formatAuthorLastFirst(a));
  return `${formatted.join(', ')}, and ${authors[authors.length - 1]}`;
}

function formatAuthorsHarvard(authors: string[]): string {
  if (authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return formatAuthorLastFirst(authors[0]);
  if (authors.length === 2) {
    return `${formatAuthorLastFirst(authors[0])} and ${
      formatAuthorLastFirst(
        authors[1],
      )
    }`;
  }

  return `${formatAuthorLastFirst(authors[0])} et al.`;
}

function generateBibTeXKey(citation: UnifiedCitation): string {
  const author = citation.authors[0]?.split(' ').pop()?.toLowerCase() ||
    'unknown';
  const year = citation.year || 'nodate';
  const titleWord = citation.title.split(' ')[0]?.toLowerCase() || 'untitled';
  return `${author}${year}${titleWord}`;
}

export function fromCrossref(reference: Reference): UnifiedCitation {
  const authors = reference.author?.map((author) => {
    const given = author.given || '';
    const family = author.family || '';
    return `${given} ${family}`.trim();
  }) || [];

  const year = reference.created?.['date-time'] ? new Date(reference.created['date-time']).getFullYear() : undefined;

  return {
    title: reference.title?.[0] || 'Untitled',
    authors,
    year,
    publisher: reference.publisher,
    doi: reference.DOI,
    isbn: reference.ISBN,
    url: reference.URL || reference.resource?.primary?.URL,
    abstract: reference.abstract,
    type: mapCrossrefType(reference.type),
    source: 'crossref',
    language: reference.language,
  };
}

export function fromGoogleBooks(book: GoogleBooksItem): UnifiedCitation {
  const isbn = book.volumeInfo.industryIdentifiers?.map((id) => id.identifier) || [];

  const year = book.volumeInfo.publishedDate ? new Date(book.volumeInfo.publishedDate).getFullYear() : undefined;

  return {
    title: book.volumeInfo.title,
    authors: book.volumeInfo.authors || [],
    year,
    publisher: book.volumeInfo.publisher,
    isbn,
    url: book.volumeInfo.infoLink,
    abstract: book.volumeInfo.description,
    type: 'book',
    source: 'googlebooks',
    language: book.volumeInfo.language,
  };
}

export function fromOpenLibrary(book: OpenLibraryItem): UnifiedCitation {
  return {
    title: book.title,
    authors: book.author_name || [],
    year: book.first_publish_year,
    publisher: book.publisher?.[0],
    isbn: book.isbn,
    url: `https://openlibrary.org${book.key}`,
    type: 'book',
    source: 'openlibrary',
    language: book.language?.[0],
  };
}

export function toAPA(citation: UnifiedCitation): string {
  const authors = formatAuthorsAPA(citation.authors);
  const year = citation.year ? `(${citation.year})` : '(n.d.)';
  const title = citation.type === 'book' ? `<i>${citation.title}</i>` : citation.title;

  let result = `${authors} ${year}. ${title}.`;

  if (citation.publisher) {
    result += ` ${citation.publisher}.`;
  }

  if (citation.doi) {
    result += ` https://doi.org/${citation.doi}`;
  } else if (citation.url) {
    result += ` ${citation.url}`;
  }

  return result;
}

export function toMLA(citation: UnifiedCitation): string {
  const authors = formatAuthorsMLA(citation.authors);
  const title = citation.type === 'book' ? `<i>${citation.title}</i>` : `"${citation.title}"`;

  let result = `${authors}. ${title}.`;

  if (citation.publisher) {
    result += ` ${citation.publisher}`;
  }

  if (citation.year) {
    result += `, ${citation.year}`;
  }

  result += '.';

  if (citation.url) {
    result += ` ${citation.url}.`;
  }

  return result;
}

export function toChicago(citation: UnifiedCitation): string {
  const authors = formatAuthorsChicago(citation.authors);
  const year = citation.year || 'n.d.';
  const title = citation.type === 'book' ? `<i>${citation.title}</i>` : `"${citation.title}"`;

  let result = `${authors}. ${year}. ${title}.`;

  if (citation.publisher) {
    result += ` ${citation.publisher}.`;
  }

  if (citation.doi) {
    result += ` https://doi.org/${citation.doi}.`;
  } else if (citation.url) {
    result += ` ${citation.url}.`;
  }

  return result;
}

export function toHarvard(citation: UnifiedCitation): string {
  const authors = formatAuthorsHarvard(citation.authors);
  const year = citation.year || 'n.d.';
  const title = citation.type === 'book' ? `<i>${citation.title}</i>` : citation.title;

  let result = `${authors} (${year}) ${title}.`;

  if (citation.publisher) {
    result += ` ${citation.publisher}.`;
  }

  if (citation.url) {
    result += ` Available at: ${citation.url}`;
  }

  return result;
}

export function toBibTeX(citation: UnifiedCitation): string {
  const key = generateBibTeXKey(citation);
  const type = citation.type === 'book' ? 'book' : 'article';

  let bibtex = `@${type}{${key},\n`;
  bibtex += `  title={${citation.title}},\n`;

  if (citation.authors.length > 0) {
    const authors = citation.authors.join(' and ');
    bibtex += `  author={${authors}},\n`;
  }

  if (citation.year) {
    bibtex += `  year={${citation.year}},\n`;
  }

  if (citation.publisher) {
    bibtex += `  publisher={${citation.publisher}},\n`;
  }

  if (citation.doi) {
    bibtex += `  doi={${citation.doi}},\n`;
  }

  if (citation.isbn && citation.isbn.length > 0) {
    bibtex += `  isbn={${citation.isbn[0]}},\n`;
  }

  if (citation.url) {
    bibtex += `  url={${citation.url}},\n`;
  }

  bibtex += '}';
  return bibtex;
}
