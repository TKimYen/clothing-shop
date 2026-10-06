"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Badge, Button } from "@/src/components/ui";
import { DataTable, type Column } from "@/src/components/admin/data-table";
import { PageHeader } from "@/src/components/admin/layout";
import { StockImportFormDialog } from "@/src/components/admin/forms/stock-import-form";
import { useAdminList } from "@/src/hooks/use-admin-list";
import { useCreateMutation } from "@/src/hooks/use-admin-mutation";
import { productService, stockImportService } from "@/src/lib/services";
import { formatCurrency, formatDateTime, formatNumber } from "@/src/lib/utils";
import type { StockImport, StockImportInput } from "@/src/types";

const DEFAULTS = { sort: "createdAt", direction: "desc" as const };

/** Units and (known) cost of one import. Lines without a unit cost are left out of the cost. */
function totals(entry: StockImport) {
  return entry.items.reduce(
    (acc, item) => ({
      units: acc.units + item.quantity,
      cost: item.unitCost === null ? acc.cost : acc.cost + item.unitCost * item.quantity,
      hasCost: acc.hasCost || item.unitCost !== null,
    }),
    { units: 0, cost: 0, hasCost: false },
  );
}

export default function StockImportsPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = React.useState(false);

  const list = useAdminList<StockImport>({
    queryKeyPrefix: "stock-imports",
    defaults: DEFAULTS,
    fetchPage: stockImportService.list,
  });

  // Products (with their variants) for the picker; only loaded once the dialog opens.
  const { data: products } = useQuery({
    queryKey: ["products", "stock-import-picker"],
    queryFn: () => productService.list({ pageSize: 200, sort: "name", direction: "asc" }),
    enabled: creating,
  });
  const { data: options } = useQuery({
    queryKey: ["products", "options"],
    queryFn: productService.options,
    enabled: creating,
  });

  const create = useCreateMutation<StockImportInput, StockImport>({
    queryKey: "stock-imports",
    entityLabel: "Stock import",
    successMessage: (created) => `${created.code}: received ${formatNumber(totals(created).units)} units`,
    mutationFn: stockImportService.create,
    onSuccess: () => {
      // Stock changed: refresh product stock figures and the dashboard too.
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setCreating(false);
    },
  });

  const columns = React.useMemo<Column<StockImport>[]>(
    () => [
      {
        key: "code",
        header: "Import",
        render: (entry) => (
          <div className="min-w-0">
            <span className="block font-mono text-xs font-bold text-ink">{entry.code}</span>
            <span className="mt-0.5 block text-[11px] text-muted">
              {entry.createdByName ? `by ${entry.createdByName}` : "—"}
            </span>
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Received",
        sortable: true,
        render: (entry) => (
          <span className="text-xs whitespace-nowrap text-muted">{formatDateTime(entry.createdAt)}</span>
        ),
      },
      {
        key: "items",
        header: "Variants",
        render: (entry) => (
          <ul className="grid gap-1">
            {entry.items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-xs">
                <Badge tone="success">+{formatNumber(item.quantity)}</Badge>
                <Link
                  href={`/admin/products/${item.productId}`}
                  className="truncate font-medium text-ink hover:text-brand"
                >
                  {item.productName}
                </Link>
                <span className="whitespace-nowrap text-muted">
                  {item.sizeLabel} · {item.colorName}
                </span>
              </li>
            ))}
          </ul>
        ),
      },
      {
        key: "units",
        header: "Units",
        className: "text-right",
        headerClassName: "text-right",
        render: (entry) => (
          <span className="text-sm font-semibold text-ink">{formatNumber(totals(entry).units)}</span>
        ),
      },
      {
        key: "cost",
        header: "Cost",
        className: "text-right",
        headerClassName: "text-right",
        render: (entry) => {
          const { cost, hasCost } = totals(entry);
          return <span className="text-sm">{hasCost ? formatCurrency(cost) : "—"}</span>;
        },
      },
      {
        key: "note",
        header: "Note",
        render: (entry) => (
          <span className="block max-w-56 truncate text-xs text-muted">{entry.note || "—"}</span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Stock imports"
        description="Receiving goods is the only way stock increases. Imports are permanent and cannot be edited."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <PackagePlus className="size-3.5" />
            New stock import
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={list.data?.items ?? []}
        getRowId={(entry) => entry.id}
        isLoading={list.isLoading}
        error={list.isError ? list.error : undefined}
        onRetry={() => void list.refetch()}
        total={list.data?.total ?? 0}
        page={list.data?.page ?? 1}
        pageSize={list.data?.pageSize ?? list.state.pageSize}
        onPageChange={list.goToPage}
        onPageSizeChange={list.setPageSize}
        itemLabel="imports"
        searchValue={list.searchInput}
        onSearchChange={list.setSearch}
        isSearchPending={list.isSearchPending}
        searchPlaceholder="Search import code or note"
        sort={list.state.sort}
        direction={list.state.direction}
        onSortChange={list.setSort}
        emptyTitle={list.searchInput ? "No imports match" : "No stock received yet"}
        emptyDescription="Create a stock import to add units to a product's variants."
        emptyAction={
          list.searchInput ? (
            <Button variant="secondary" size="sm" onClick={list.resetAll}>
              Clear search
            </Button>
          ) : (
            <Button size="sm" onClick={() => setCreating(true)}>
              New stock import
            </Button>
          )
        }
      />

      {options ? (
        <StockImportFormDialog
          open={creating}
          onOpenChange={setCreating}
          products={products?.items ?? []}
          options={options}
          onSubmit={async (input) => {
            await create.mutateAsync(input);
          }}
        />
      ) : null}
    </>
  );
}
