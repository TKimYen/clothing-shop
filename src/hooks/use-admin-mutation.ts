"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListResult } from "@/src/types";
import { errorMessage } from "@/src/lib/services";

type BaseConfig = {
  /** First segment of every query key this entity uses. */
  queryKey: string;
  entityLabel: string;
};

/** Create/update always have the saved entity, so the message may depend on it. */
type SaveConfig<TEntity> = BaseConfig & {
  successMessage: string | ((entity: TEntity) => string);
};

/**
 * Delete has no entity to interpolate, so the message is a plain string with a
 * sensible `"<Entity> deleted"` default.
 */
type DeleteConfig = BaseConfig & {
  successMessage?: string;
};

/* -------------------------------------------------------------------------- */
/* Create                                                                      */
/* -------------------------------------------------------------------------- */

export function useCreateMutation<TInput, TEntity extends { id: string }>(
  config: SaveConfig<TEntity> & {
    mutationFn: (input: TInput) => Promise<TEntity>;
    onSuccess?: (entity: TEntity) => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: config.mutationFn,
    onSuccess: (entity) => {
      toast.success(
        typeof config.successMessage === "function"
          ? config.successMessage(entity)
          : config.successMessage,
      );
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      config.onSuccess?.(entity);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Update                                                                      */
/* -------------------------------------------------------------------------- */

export function useUpdateMutation<TInput extends { id: string }, TEntity extends { id: string }>(
  config: SaveConfig<TEntity> & {
    mutationFn: (input: TInput) => Promise<TEntity>;
    onSuccess?: (entity: TEntity) => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: config.mutationFn,
    onSuccess: (entity, variables) => {
      toast.success(
        typeof config.successMessage === "function"
          ? config.successMessage(entity)
          : config.successMessage,
      );
      // Patch the cached detail entry immediately so a redirect to the detail
      // page does not flash the pre-edit values.
      queryClient.setQueryData([config.queryKey, "detail", variables.id], entity);
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      config.onSuccess?.(entity);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Delete (optimistic, with rollback)                                          */
/* -------------------------------------------------------------------------- */

type DeleteContext = { previous: Array<[QueryKey, unknown]> };

/**
 * Not every cache entry under an entity prefix is a list: pages also cache
 * things like `["sizes", "counts"]`. The optimistic removal only applies to
 * actual `ListResult` entries, otherwise it would corrupt that other shape.
 */
export function isListResult<TEntity>(value: unknown): value is ListResult<TEntity> {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as ListResult<TEntity>).items)
  );
}

/**
 * Drops `id` from every cached list under `queryKey` and returns the entries it
 * touched, so a rejected delete can be rolled back exactly.
 *
 * Extracted from the hook so the cache interaction can be tested without a DOM.
 */
export function optimisticallyRemoveFromLists<TEntity extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string,
  id: string,
): Array<[QueryKey, unknown]> {
  const previous = queryClient
    .getQueriesData<ListResult<TEntity>>({ queryKey: [queryKey] })
    .filter(([, value]) => isListResult<TEntity>(value));

  queryClient.setQueriesData<ListResult<TEntity>>({ queryKey: [queryKey] }, (current) =>
    isListResult<TEntity>(current)
      ? {
          ...current,
          items: current.items.filter((item) => item.id !== id),
          total: Math.max(0, current.total - 1),
        }
      : current,
  );

  return previous;
}

export function useDeleteMutation<TEntity extends { id: string }>(
  config: DeleteConfig & {
    mutationFn: (id: string) => Promise<void>;
  },
) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string, DeleteContext>({
    mutationFn: config.mutationFn,

    /**
     * Remove the row from every cached list immediately, snapshotting the
     * previous value so a rejected service call can be undone exactly.
     */
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [config.queryKey] });
      const previous = optimisticallyRemoveFromLists<TEntity>(queryClient, config.queryKey, id);
      return { previous };
    },

    onError: (error, _id, context) => {
      // Roll back every list we optimistically touched.
      context?.previous.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
      toast.error(errorMessage(error));
    },

    onSuccess: () => {
      toast.success(config.successMessage ?? `${config.entityLabel} deleted`);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
    },
  });
}
