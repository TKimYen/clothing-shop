export type SortDirection = "asc" | "desc";

/**
 * Server-style list contract. Every mock service accepts this and returns
 * `ListResult<T>` so the UI never assumes a full in-memory array.
 */
export type ListParams = {
  /** 1-based. */
  page?: number;
  pageSize?: number;
  search?: string;
  /** Sort key, meaningful per entity. */
  sort?: string;
  direction?: SortDirection;
  filters?: Record<string, string | undefined>;
};

export type ListResult<T> = {
  items: T[];
  total: number;
  /** 1-based, echoed back after clamping. */
  page: number;
  pageSize: number;
};

export type EntityDraft<TInput, TEntity> = {
  create: (input: TInput) => Promise<TEntity>;
  update: (id: string, input: TInput) => Promise<TEntity>;
  remove: (id: string) => Promise<void>;
  get: (id: string) => Promise<TEntity | null>;
  list: (params?: ListParams) => Promise<ListResult<TEntity>>;
};
