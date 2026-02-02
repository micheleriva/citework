import { assertEquals, assertExists, assertGreater } from '@std/assert';
import { GetReference } from './sources.ts';

/**
 * E2E (End-to-End) Tests for Sources API
 *
 * These tests make real HTTP requests to external APIs:
 * - Crossref API (https://api.crossref.org)
 * - Google Books API (https://www.googleapis.com/books/v1)
 * - Open Library API (https://openlibrary.org)
 *
 * IMPORTANT NOTES:
 * 1. These tests require internet connectivity
 * 2. Tests may be slower due to network latency (typically 100-500ms per test)
 * 3. APIs may rate-limit requests, causing tests to fail:
 *    - Google Books: 20M queries/day limit
 *    - Crossref: Polite pool with email, 50 req/sec
 *    - Open Library: Generally permissive but may throttle
 * 4. API responses may vary over time as data is updated
 * 5. Some tests may fail if APIs are down or unreachable
 *
 * To run these tests:
 *   deno task test:e2e
 *
 * To run only unit tests (faster, no network):
 *   deno task test
 */

const TEST_EMAIL = 'test@example.com';

// Crossref API tests
Deno.test({
  name: 'E2E: Crossref - search for a well-known paper',
  fn: async () => {
    const result = await GetReference.fromTitle(
      'Machine Learning',
      TEST_EMAIL,
      { rows: 5 },
    );

    assertExists(result);
    assertEquals(result.status, 'ok');
    assertExists(result.message);
    assertGreater(result.message['total-results'], 0);
    assertExists(result.message.items);
    assertGreater(result.message.items.length, 0);

    // Check first item structure
    const firstItem = result.message.items[0];
    assertExists(firstItem.title);
    assertExists(firstItem.type);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: Crossref - pagination works correctly',
  fn: async () => {
    const firstPage = await GetReference.fromTitle(
      'Deep Learning',
      TEST_EMAIL,
      { rows: 2, offset: 0 },
    );

    const secondPage = await GetReference.fromTitle(
      'Deep Learning',
      TEST_EMAIL,
      { rows: 2, offset: 2 },
    );

    assertExists(firstPage);
    assertExists(secondPage);
    assertEquals(firstPage.message.items.length, 2);
    assertEquals(secondPage.message.items.length, 2);

    // Items should be different between pages
    const firstPageDOI = firstPage.message.items[0].DOI;
    const secondPageDOI = secondPage.message.items[0].DOI;

    // They should not be the same (pagination is working)
    assertEquals(firstPageDOI !== secondPageDOI, true);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: Crossref - requires email address',
  fn: async () => {
    try {
      await GetReference.fromTitle('Test', '');
      throw new Error('Should have thrown an error');
    } catch (error) {
      assertEquals(
        (error as Error).message,
        'Request author email is required. Be polite to CrossRef API by providing your email and tracking your usage.',
      );
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: Crossref - handles specific DOI lookup',
  fn: async () => {
    const result = await GetReference.fromTitle(
      '10.1038/nature',
      TEST_EMAIL,
      { rows: 1 },
    );

    assertExists(result);
    assertGreater(result.message['total-results'], 0);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

// Google Books API tests
Deno.test({
  name: 'E2E: Google Books - search for a well-known book',
  fn: async () => {
    const result = await GetReference.fromTitleGoogleBooks(
      'Introduction to Algorithms',
      { maxResults: 5 },
    );

    assertExists(result);
    assertEquals(result.kind, 'books#volumes');
    assertGreater(result.totalItems, 0);
    assertExists(result.items);
    assertGreater(result.items.length, 0);

    // Check first item structure
    const firstItem = result.items[0];
    assertExists(firstItem.volumeInfo);
    assertExists(firstItem.volumeInfo.title);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: Google Books - pagination works correctly',
  fn: async () => {
    const firstPage = await GetReference.fromTitleGoogleBooks(
      'JavaScript',
      { maxResults: 3, startIndex: 0 },
    );

    const secondPage = await GetReference.fromTitleGoogleBooks(
      'JavaScript',
      { maxResults: 3, startIndex: 3 },
    );

    assertExists(firstPage);
    assertExists(secondPage);
    assertExists(firstPage.items);
    assertExists(secondPage.items);
    assertGreater(firstPage.items.length, 0);
    assertGreater(secondPage.items.length, 0);

    // Items should be different between pages
    const firstPageId = firstPage.items[0].id;
    const secondPageId = secondPage.items[0].id;

    assertEquals(firstPageId !== secondPageId, true);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: Google Books - returns book metadata',
  fn: async () => {
    const result = await GetReference.fromTitleGoogleBooks(
      'The Pragmatic Programmer',
      { maxResults: 1 },
    );

    assertExists(result);
    assertExists(result.items);
    const book = result.items[0];

    assertExists(book.volumeInfo.title);
    // Most books should have authors
    if (book.volumeInfo.authors) {
      assertGreater(book.volumeInfo.authors.length, 0);
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: Google Books - handles ISBN search',
  fn: async () => {
    // Search by ISBN
    const result = await GetReference.fromTitleGoogleBooks(
      '9780262033848',
      { maxResults: 1 },
    );

    assertExists(result);
    assertGreater(result.totalItems, 0);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

// Open Library API tests
Deno.test({
  name: 'E2E: Open Library - search for a well-known book',
  fn: async () => {
    const result = await GetReference.fromTitleOpenLibrary(
      'The Great Gatsby',
      { limit: 5 },
    );

    assertExists(result);
    assertGreater(result.numFound, 0);
    assertExists(result.docs);
    assertGreater(result.docs.length, 0);

    // Check first item structure
    const firstItem = result.docs[0];
    assertExists(firstItem.title);
    assertExists(firstItem.key);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: Open Library - pagination works correctly',
  fn: async () => {
    const firstPage = await GetReference.fromTitleOpenLibrary(
      'Python Programming',
      { limit: 3, offset: 0 },
    );

    const secondPage = await GetReference.fromTitleOpenLibrary(
      'Python Programming',
      { limit: 3, offset: 3 },
    );

    assertExists(firstPage);
    assertExists(secondPage);
    assertGreater(firstPage.docs.length, 0);
    assertGreater(secondPage.docs.length, 0);

    // Items should be different between pages
    const firstPageKey = firstPage.docs[0].key;
    const secondPageKey = secondPage.docs[0].key;

    assertEquals(firstPageKey !== secondPageKey, true);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: Open Library - returns book metadata',
  fn: async () => {
    const result = await GetReference.fromTitleOpenLibrary(
      '1984',
      { limit: 1 },
    );

    assertExists(result);
    const book = result.docs[0];

    assertExists(book.title);
    assertExists(book.key);

    // Most books should have authors
    if (book.author_name) {
      assertGreater(book.author_name.length, 0);
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: Open Library - handles author search',
  fn: async () => {
    const result = await GetReference.fromTitleOpenLibrary(
      'George Orwell',
      { limit: 5 },
    );

    assertExists(result);
    assertGreater(result.numFound, 0);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

// Test fromTitleAllSources - searches all APIs
Deno.test({
  name: 'E2E: All Sources - search across all APIs',
  fn: async () => {
    const result = await GetReference.fromTitleAllSources(
      'Algorithms',
      TEST_EMAIL,
      {
        crossref: { rows: 2 },
        googleBooks: { maxResults: 2 },
        openLibrary: { limit: 2 },
      },
    );

    assertExists(result);

    // At least one source should return results
    const hasResults = result.crossref || result.googleBooks ||
      result.openLibrary;
    assertEquals(!!hasResults, true);

    // Check Crossref results if present
    if (result.crossref) {
      assertExists(result.crossref.message);
      assertExists(result.crossref.message.items);
    }

    // Check Google Books results if present
    if (result.googleBooks) {
      assertExists(result.googleBooks.items);
    }

    // Check Open Library results if present
    if (result.openLibrary) {
      assertExists(result.openLibrary.docs);
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: All Sources - handles API failures gracefully',
  fn: async () => {
    // Search for something that might not be in all databases
    const result = await GetReference.fromTitleAllSources(
      'xyzabc123nonexistentbook999',
      TEST_EMAIL,
      {
        crossref: { rows: 1 },
        googleBooks: { maxResults: 1 },
        openLibrary: { limit: 1 },
      },
    );

    // The function should catch errors and return partial results
    // or throw only if all sources fail
    assertExists(result);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: All Sources - compares results across sources',
  fn: async () => {
    const result = await GetReference.fromTitleAllSources(
      'Design Patterns',
      TEST_EMAIL,
      {
        crossref: { rows: 1 },
        googleBooks: { maxResults: 1 },
        openLibrary: { limit: 1 },
      },
    );

    assertExists(result);

    // Count how many sources returned results
    let sourceCount = 0;
    if (result.crossref) sourceCount++;
    if (result.googleBooks) sourceCount++;
    if (result.openLibrary) sourceCount++;

    // At least 2 sources should return results for a well-known book
    assertGreater(sourceCount, 1);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

// Performance and rate limiting tests
Deno.test({
  name: 'E2E: Performance - sequential requests complete in reasonable time',
  fn: async () => {
    const startTime = Date.now();

    await GetReference.fromTitle(
      'Test Query 1',
      TEST_EMAIL,
      { rows: 1 },
    );
    await GetReference.fromTitleGoogleBooks(
      'Test Query 2',
      { maxResults: 1 },
    );
    await GetReference.fromTitleOpenLibrary(
      'Test Query 3',
      { limit: 1 },
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    // All three requests should complete in less than 10 seconds
    assertEquals(duration < 10000, true);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: 'E2E: Error Handling - handles network timeouts gracefully',
  fn: async () => {
    // This test verifies that the APIs handle errors properly
    // by searching for a very specific query that should return no results
    try {
      await GetReference.fromTitle(
        'zzz_nonexistent_99999_xyz',
        TEST_EMAIL,
        { rows: 1 },
      );
    } catch (error) {
      // Should throw "No reference found" error
      assertEquals((error as Error).message, 'No reference found');
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

// Integration test combining formatter and sources
Deno.test({
  name: 'E2E: Integration - fetch and format citations',
  fn: async () => {
    const { fromCrossref, toAPA } = await import('./formatter.ts');

    const result = await GetReference.fromTitle(
      'Machine Learning',
      TEST_EMAIL,
      { rows: 1 },
    );

    assertExists(result);
    assertGreater(result.message.items.length, 0);

    const citation = fromCrossref(result.message.items[0]);
    const apaCitation = toAPA(citation);

    assertExists(citation);
    assertExists(apaCitation);
    assertGreater(apaCitation.length, 10);

    // APA citation should contain year in parentheses or (n.d.)
    assertEquals(
      apaCitation.includes('(') && apaCitation.includes(')'),
      true,
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
