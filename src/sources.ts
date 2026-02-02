export type Reference = {
  indexed: {
    'date-time': string;
    timestamp: number;
    version: string;
  };
  'edition-number': number;
  'reference-count': number;
  publisher: string;
  'isbn-type': Array<{
    type: string;
    value: string;
  }>;
  abstract: string;
  DOI: string;
  type: string;
  created: {
    'date-time': string;
    timestamp: number;
  };
  source: string;
  title: string[];
  prefix: string;
  author: Array<{
    given: string;
    family: string;
    sequence: string;
    affiliation: Array<{
      name: string;
    }>;
  }>;
  language: string;
  score: number;
  resource: {
    primary: {
      URL: string;
    };
  };
  editor: Array<{
    given: string;
    family: string;
    sequence: string;
    affiliation: Array<{
      name: string;
    }>;
  }>;
  ISBN: string[];
  URL: string;
};

export type ReferencesSearchResponse = {
  status: string;
  message: {
    'total-results': number;
    items: Reference[];
  };
};

export type PaginationOptions = {
  rows?: number;
  offset?: number;
};

export type GoogleBooksPaginationOptions = {
  maxResults?: number;
  startIndex?: number;
};

export type OpenLibraryPaginationOptions = {
  limit?: number;
  offset?: number;
};

export type GoogleBooksItem = {
  kind: string;
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[];
    language?: string;
    infoLink?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
};

export type GoogleBooksResponse = {
  kind: string;
  totalItems: number;
  items?: GoogleBooksItem[];
};

export type OpenLibraryItem = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  publisher?: string[];
  language?: string[];
  subject?: string[];
  author_key?: string[];
  edition_count?: number;
  cover_i?: number;
  ebook_access?: string;
  ebook_count_i?: number;
};

export type OpenLibraryResponse = {
  numFound: number;
  start: number;
  docs: OpenLibraryItem[];
};

export type CombinedReference = {
  source: 'crossref' | 'googlebooks' | 'openlibrary';
  data: Reference | GoogleBooksItem | OpenLibraryItem;
};

export class GetReference {
  private static crossrefURL = 'https://api.crossref.org/works';
  private static googleBooksURL = 'https://www.googleapis.com/books/v1/volumes';
  private static openLibraryURL = 'https://openlibrary.org/search.json';

  static async fromTitle(
    title: string,
    reqAuthor: string,
    options?: PaginationOptions,
  ): Promise<ReferencesSearchResponse> {
    if (!reqAuthor || reqAuthor.trim() === '') {
      throw new Error(
        'Request author email is required. Be polite to CrossRef API by providing your email and tracking your usage.',
      );
    }

    const url = new URL(GetReference.crossrefURL);

    url.searchParams.append('query', title);

    if (options?.rows !== undefined) {
      url.searchParams.append('rows', options.rows.toString());
    }

    if (options?.offset !== undefined) {
      url.searchParams.append('offset', options.offset.toString());
    }

    url.searchParams.append('mailto', reqAuthor);

    const req = await fetch(url.toString());
    const res = await req.json();

    if (!res.message || !res.message.items || res.message.items.length === 0) {
      throw new Error('No reference found');
    }

    return res;
  }

  static async fromTitleGoogleBooks(
    title: string,
    options?: GoogleBooksPaginationOptions,
  ): Promise<GoogleBooksResponse> {
    const url = new URL(GetReference.googleBooksURL);

    url.searchParams.append('q', title);

    if (options?.maxResults !== undefined) {
      url.searchParams.append('maxResults', options.maxResults.toString());
    }

    if (options?.startIndex !== undefined) {
      url.searchParams.append('startIndex', options.startIndex.toString());
    }

    const req = await fetch(url.toString());
    const res = await req.json();

    if (!res.items || res.items.length === 0) {
      throw new Error('No books found');
    }

    return res;
  }

  static async fromTitleOpenLibrary(
    title: string,
    options?: OpenLibraryPaginationOptions,
  ): Promise<OpenLibraryResponse> {
    const url = new URL(GetReference.openLibraryURL);

    url.searchParams.append('title', title);

    if (options?.limit !== undefined) {
      url.searchParams.append('limit', options.limit.toString());
    }

    if (options?.offset !== undefined) {
      url.searchParams.append('offset', options.offset.toString());
    }

    const req = await fetch(url.toString());
    const res = await req.json();

    if (!res.docs || res.docs.length === 0) {
      throw new Error('No books found in Open Library');
    }

    return res;
  }

  static async fromTitleAllSources(
    title: string,
    reqAuthor: string,
    options?: {
      crossref?: PaginationOptions;
      googleBooks?: GoogleBooksPaginationOptions;
      openLibrary?: OpenLibraryPaginationOptions;
    },
  ): Promise<{
    crossref?: ReferencesSearchResponse;
    googleBooks?: GoogleBooksResponse;
    openLibrary?: OpenLibraryResponse;
  }> {
    const results: {
      crossref?: ReferencesSearchResponse;
      googleBooks?: GoogleBooksResponse;
      openLibrary?: OpenLibraryResponse;
    } = {};

    try {
      results.crossref = await GetReference.fromTitle(
        title,
        reqAuthor,
        options?.crossref,
      );
    } catch (error) {
      console.warn('Crossref search failed:', error);
    }

    try {
      results.googleBooks = await GetReference.fromTitleGoogleBooks(
        title,
        options?.googleBooks,
      );
    } catch (error) {
      console.warn('Google Books search failed:', error);
    }

    try {
      results.openLibrary = await GetReference.fromTitleOpenLibrary(
        title,
        options?.openLibrary,
      );
    } catch (error) {
      console.warn('Open Library search failed:', error);
    }

    if (!results.crossref && !results.googleBooks && !results.openLibrary) {
      throw new Error('No results found from any source');
    }

    return results;
  }
}
