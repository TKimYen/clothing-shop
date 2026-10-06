"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as React from "react";
import { ActiveBadge, Badge, Button } from "@/src/components/ui";
import type { Column } from "@/src/components/admin/data-table";
import { CrudListPage, RowActions } from "@/src/components/admin/crud-list-page";
import { CollectionFormDialog } from "@/src/components/admin/forms/catalog-forms";
import { FilterChip, FilterSelect } from "@/src/components/admin/primitives";
import {
  useCreateMutation,
  useDeleteMutation,
  useUpdateMutation,
} from "@/src/hooks/use-admin-mutation";
import { useAdminList } from "@/src/hooks/use-admin-list";
import { collectionService } from "@/src/lib/services";
import { formatDate } from "@/src/lib/utils";
import type { Collection, CollectionInput } from "@/src/types";
import { SEASONS, formatSeason } from "@/src/types";

const DEFAULTS = {
  sort: "name",
  direction: "asc" as const,
  filterKeys: ["season", "isActive"] as const,
};

const SEASON_OPTIONS = SEASONS.map((season) => ({
  value: season.value,
  label: season.label,
}));

export default function CollectionsPage() {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Collection | null>(null);

  const list = useAdminList<Collection>({
    queryKeyPrefix: "collections",
    defaults: DEFAULTS,
    fetchPage: collectionService.list,
  });

  const { data: counts } = useQuery({
    queryKey: ["collections", "counts"],
    queryFn: collectionService.counts,
  });

  const createCollection = useCreateMutation<CollectionInput, Collection>({
    queryKey: "collections",
    entityLabel: "Collection",
    successMessage: (collection) => `${collection.name} created`,
    mutationFn: collectionService.create,
    onSuccess: () => setFormOpen(false),
  });

  const updateCollection = useUpdateMutation<CollectionInput & { id: string }, Collection>({
    queryKey: "collections",
    entityLabel: "Collection",
    successMessage: (collection) => `${collection.name} updated`,
    mutationFn: ({ id, ...input }) => collectionService.update(id, input),
    onSuccess: () => {
      setFormOpen(false);
      setEditing(null);
    },
  });

  const deleteCollection = useDeleteMutation<Collection>({
    queryKey: "collections",
    entityLabel: "Collection",
    mutationFn: collectionService.remove,
  });

  const buildColumns = React.useCallback(
    (requestDelete: (item: Collection) => void): Column<Collection>[] => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (collection) => (
          <div className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{collection.name}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-muted">
              {collection.slug}
            </span>
          </div>
        ),
      },
      {
        key: "season",
        header: "Season",
        sortable: true,
        render: (collection) => (
          <span className="text-sm">
            {formatSeason(collection.season)} {collection.year}
          </span>
        ),
      },
      {
        key: "startsAt",
        header: "Starts",
        sortable: true,
        render: (collection) => (
          <span className="text-xs whitespace-nowrap text-muted">
            {formatDate(collection.startsAt)}
          </span>
        ),
      },
      {
        key: "products",
        header: "Products",
        className: "text-right",
        render: (collection) => {
          const count = counts?.[collection.id] ?? 0;
          return <Badge tone={count > 0 ? "info" : "neutral"}>{count}</Badge>;
        },
      },
      {
        key: "isActive",
        header: "Status",
        render: (collection) => <ActiveBadge isActive={collection.isActive} />,
      },
      {
        key: "actions",
        header: "Actions",
        className: "text-right",
        render: (collection) => (
          <RowActions
            label={collection.name}
            onEdit={() => {
              setEditing(collection);
              setFormOpen(true);
            }}
            onDelete={() => requestDelete(collection)}
          />
        ),
      },
    ],
    [counts],
  );

  const submit = async (input: CollectionInput) => {
    if (editing) await updateCollection.mutateAsync({ id: editing.id, ...input });
    else await createCollection.mutateAsync(input);
  };

  const { filters } = list.state;

  return (
    <CrudListPage
      eyebrow="Catalog"
      title="Collections"
      description="Seasonal groupings. A collection still referenced by a product cannot be deleted."
      itemLabel="collections"
      buildColumns={buildColumns}
      list={list}
      getRowId={(collection) => collection.id}
      deleteMutation={deleteCollection}
      deleteTitle={(collection) => `Delete ${collection.name}?`}
      searchPlaceholder="Search collections"
      addAction={
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-3.5" />
          New collection
        </Button>
      }
      toolbar={
        <>
          <FilterSelect
            id="filter-season"
            label="Season"
            value={filters.season ?? ""}
            placeholder="All seasons"
            options={SEASON_OPTIONS}
            onChange={(value) => list.setFilter("season", value)}
          />
          <FilterSelect
            id="filter-collection-active"
            label="Status"
            value={filters.isActive ?? ""}
            placeholder="Any status"
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Draft" },
            ]}
            onChange={(value) => list.setFilter("isActive", value)}
          />
        </>
      }
      meta={
        list.hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2">
            <span>Filters:</span>
            {filters.season ? (
              <FilterChip label={formatSeason(filters.season)} onClear={() => list.setFilter("season", "")} />
            ) : null}
            {filters.isActive ? (
              <FilterChip
                label={filters.isActive === "true" ? "Active" : "Draft"}
                onClear={() => list.setFilter("isActive", "")}
              />
            ) : null}
            <Button variant="link" size="sm" onClick={list.clearFilters}>
              Clear all
            </Button>
          </div>
        ) : null
      }
      formDialog={
        <CollectionFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          collection={editing}
          onSubmit={submit}
        />
      }
    />
  );
}
