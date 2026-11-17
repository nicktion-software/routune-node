import type { RequestOptions } from './core';

/** The list envelope every list endpoint returns. */
export interface ListResponse<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
  next_cursor?: string | null;
}

export type PageFetcher<T> = (cursor: string | undefined) => Promise<ListResponse<T>>;

/**
 * One page of a list. Lists are newest first. Iterate the page with `for await` to walk every
 * item across all pages, or use `hasNextPage()` / `getNextPage()` to go page by page.
 */
export class Page<T> implements AsyncIterable<T> {
  readonly object = 'list' as const;
  readonly data: T[];
  readonly has_more: boolean;
  readonly next_cursor: string | null;

  constructor(
    body: ListResponse<T>,
    private readonly fetchPage: PageFetcher<T>,
  ) {
    this.data = Array.isArray(body.data) ? body.data : [];
    this.has_more = Boolean(body.has_more);
    this.next_cursor = body.next_cursor ?? null;
  }

  hasNextPage(): boolean {
    return this.has_more && !!this.next_cursor;
  }

  async getNextPage(): Promise<Page<T>> {
    if (!this.hasNextPage()) {
      throw new Error('No next page. Check hasNextPage() first.');
    }
    return new Page(await this.fetchPage(this.next_cursor!), this.fetchPage);
  }

  /** Every page, starting with this one. */
  async *iterPages(): AsyncGenerator<Page<T>> {
    let page: Page<T> = this;
    yield page;
    while (page.hasNextPage()) {
      page = await page.getNextPage();
      yield page;
    }
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    for await (const page of this.iterPages()) {
      yield* page.data;
    }
  }
}

/**
 * What list methods return: `await` it for the first page, or `for await` over it to get every item.
 *
 *     const page = await routune.orders.list({ limit: 50 });
 *     for await (const order of routune.orders.list({ status: 'delivered' })) { … }
 */
export class PagePromise<T> implements PromiseLike<Page<T>>, AsyncIterable<T> {
  private readonly promise: Promise<Page<T>>;

  constructor(fetchPage: PageFetcher<T>, firstCursor?: string) {
    this.promise = fetchPage(firstCursor).then((body) => new Page(body, fetchPage));
  }

  then<R1 = Page<T>, R2 = never>(
    onfulfilled?: ((value: Page<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  catch<R = never>(onrejected?: ((reason: unknown) => R | PromiseLike<R>) | null): Promise<Page<T> | R> {
    return this.promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<Page<T>> {
    return this.promise.finally(onfinally);
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    const page = await this.promise;
    yield* page;
  }
}

export type { RequestOptions };
