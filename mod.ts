/**
 * Citework - Academic citation management library
 *
 * @module
 */

// Export all types and functions from sources
export {
  type CombinedReference,
  GetReference,
  type GoogleBooksItem,
  type GoogleBooksPaginationOptions,
  type GoogleBooksResponse,
  type OpenLibraryItem,
  type OpenLibraryPaginationOptions,
  type OpenLibraryResponse,
  type PaginationOptions,
  type Reference,
  type ReferencesSearchResponse,
} from './src/sources.ts';

// Export all types and functions from formatter
export {
  fromCrossref,
  fromGoogleBooks,
  fromOpenLibrary,
  toAPA,
  toBibTeX,
  toChicago,
  toHarvard,
  toMLA,
  type UnifiedCitation,
} from './src/formatter.ts';
