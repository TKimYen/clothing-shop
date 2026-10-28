"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Download,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/src/components/admin/layout";
import { ProductThumb } from "@/src/components/admin/primitives";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Input,
  Label,
  OrderStatusBadge,
} from "@/src/components/ui";
import { statisticsService } from "@/src/lib/services";
import type { StatisticsPeriod, StatisticsSummary } from "@/src/types";
import {
  REPORT_TIME_ZONE,
  addReportDays,
  cn,
  csvCell,
  formatCurrency,
  formatDate,
  formatNumber,
  formatOrderStatus,
  parseReportDate,
  reportDayCount,
  todayReportDate,
} from "@/src/lib/utils";

type RangeMode = "7" | "30" | "90" | "custom";

type RangeSelection =
  | { kind: "period"; period: StatisticsPeriod }
  | { kind: "custom"; from: string; to: string };

const PERIOD_OPTIONS: Array<{ value: RangeMode; label: string }> = [
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
  { value: "90", label: "90 ngày" },
  { value: "custom", label: "Tùy chọn" },
];

const STATUS_BAR: Record<string, string> = {
  PENDING: "bg-gold",
  CONFIRMED: "bg-azure",
  SHIPPING: "bg-plum",
  DELIVERED: "bg-moss",
  CANCELLED: "bg-danger",
};

function Delta({ value, suffix = "so với kỳ trước" }: { value: number | null; suffix?: string }) {
  if (value === null || value === undefined) {
    return <span className="text-[11px] font-semibold text-moss">Mới</span>;
  }

  if (!Number.isFinite(value)) {
    return null;
  }

  const flat = Math.abs(value) < 0.05;
  const positive = value > 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-semibold",
        flat ? "text-muted" : positive ? "text-moss" : "text-danger",
      )}
      title={`${value.toFixed(1)}% ${suffix}`}
      aria-label={`${value.toFixed(1)} phần trăm ${suffix}`}
    >
      {flat ? null : <Icon className="size-3" aria-hidden />}
      {flat ? "0%" : `${Math.abs(value).toFixed(1)}%`}
    </span>
  );
}

function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: string;
  change: number | null | undefined;
  icon: LucideIcon;
  tone: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className={`grid size-8 place-items-center rounded-lg ${tone}`}>
            <Icon className="size-4" aria-hidden />
          </span>
          {loading ? (
            <span className="h-3 w-10 animate-pulse rounded bg-canvas-line" />
          ) : change === undefined ? null : (
            <Delta value={change} />
          )}
        </div>
        <p className="mt-3 text-xs text-muted">{label}</p>
        <p className="mt-0.5 font-display text-xl font-bold text-ink">{loading ? "…" : value}</p>
      </CardBody>
    </Card>
  );
}

function exportCsv(data: StatisticsSummary) {
  const cancelled = data.statusBreakdown.find((row) => row.status === "CANCELLED")?.orders ?? 0;
  const exportedAt = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: REPORT_TIME_ZONE,
  }).format(new Date(data.generatedAt));
  const lines: string[][] = [
    ["Thống kê BlueWear"],
    ["Khoảng thời gian", `${data.range.from} - ${data.range.to}`],
    ["Múi giờ báo cáo", data.range.timeZone],
    ["Xuất lúc (giờ VN)", exportedAt],
    [],
    ["Tổng quan", "Kỳ này", "Kỳ trước"],
    ["Doanh thu (VND)", String(data.totals.revenue), String(data.previous.revenue)],
    ["Đơn hàng", String(data.totals.orders), String(data.previous.orders)],
    ["Giá trị đơn trung bình (VND)", String(data.totals.averageOrderValue), String(data.previous.averageOrderValue)],
    ["Khách hàng mới", String(data.totals.customers), String(data.previous.customers)],
    ["Sản phẩm đã bán", String(data.totals.unitsSold), String(data.previous.unitsSold)],
    ["Tổng giảm giá (VND)", String(data.totals.discountTotal), String(data.previous.discountTotal)],
    ["Phí vận chuyển thu được (VND)", String(data.totals.shippingTotal), String(data.previous.shippingTotal)],
    ["Đơn đã hủy", String(cancelled), ""],
    [],
    ["Doanh thu theo ngày"],
    ["Ngày", "Doanh thu (VND)", "Đơn hàng", "Sản phẩm đã bán"],
    ...data.daily.map((day) => [day.date, String(day.revenue), String(day.orders), String(day.unitsSold)]),
    [],
    ["Sản phẩm bán chạy"],
    ["Sản phẩm", "Số lượng", "Doanh thu gộp (VND)"],
    ...data.topProducts.map((product) => [product.name, String(product.units), String(product.revenue)]),
    [],
    ["Trạng thái đơn hàng"],
    ["Trạng thái", "Số đơn", "Giá trị đơn (VND)", "Tỷ lệ (%)"],
    ...data.statusBreakdown.map((row) => [
      formatOrderStatus(row.status),
      String(row.orders),
      String(row.value),
      row.percent.toFixed(1),
    ]),
  ];

  const csv = lines.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `thong-ke-${data.range.from}-${data.range.to}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function StatisticsPage() {
  const [mode, setMode] = useState<RangeMode>("30");
  const [selection, setSelection] = useState<RangeSelection>({ kind: "period", period: 30 });
  const [draftFrom, setDraftFrom] = useState(() => addReportDays(todayReportDate(), -29));
  const [draftTo, setDraftTo] = useState(() => todayReportDate());
  const [rangeError, setRangeError] = useState<string | null>(null);

  const { data, error, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["statistics", selection],
    queryFn: () =>
      statisticsService.getSummary(
        selection.kind === "period"
          ? { period: selection.period }
          : { from: selection.from, to: selection.to },
      ),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const maxRevenue = Math.max(1, ...(data?.daily.map((day) => day.revenue) ?? []));
  const cancelledOrders = data?.statusBreakdown.find((row) => row.status === "CANCELLED")?.orders ?? 0;
  const totalOrdersInRange = data?.statusBreakdown.reduce((sum, row) => sum + row.orders, 0) ?? 0;

  const metrics = [
    {
      label: "Doanh thu",
      value: data ? formatCurrency(data.totals.revenue) : "—",
      change: data?.change.revenue,
      icon: CircleDollarSign,
      tone: "bg-gold/15 text-gold",
    },
    {
      label: "Đơn hàng (không hủy)",
      value: data ? formatNumber(data.totals.orders) : "—",
      change: data?.change.orders,
      icon: ShoppingCart,
      tone: "bg-plum/10 text-plum",
    },
    {
      label: "Giá trị đơn trung bình",
      value: data ? formatCurrency(data.totals.averageOrderValue) : "—",
      change: data?.change.averageOrderValue,
      icon: BarChart3,
      tone: "bg-moss/10 text-moss",
    },
    {
      label: "Khách hàng mới",
      value: data ? formatNumber(data.totals.customers) : "—",
      change: data?.change.customers,
      icon: Users,
      tone: "bg-brand/10 text-brand",
    },
    {
      label: "Sản phẩm đã bán",
      value: data ? formatNumber(data.totals.unitsSold) : "—",
      change: data?.change.unitsSold,
      icon: Package,
      tone: "bg-azure/10 text-azure",
    },
  ];

  function handleModeChange(next: RangeMode) {
    setMode(next);
    setRangeError(null);

    if (next === "custom") {
      const from = data?.range.from ?? draftFrom;
      const to = data?.range.to ?? draftTo;
      setDraftFrom(from);
      setDraftTo(to);
      setSelection({ kind: "custom", from, to });
      return;
    }

    setSelection({ kind: "period", period: Number(next) as StatisticsPeriod });
  }

  function applyCustomRange() {
    const from = parseReportDate(draftFrom);
    const to = parseReportDate(draftTo);

    if (!from || !to) {
      setRangeError("Chọn đủ ngày bắt đầu và ngày kết thúc.");
      return;
    }
    if (from > to) {
      setRangeError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
      return;
    }

    const days = reportDayCount(from, to);
    if (days > 366) {
      setRangeError("Khoảng thời gian tối đa là 366 ngày.");
      return;
    }

    setRangeError(null);
    setSelection({ kind: "custom", from, to });
  }

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Statistics"
        description={
          data
            ? `Kỳ ${formatDate(data.range.from)} – ${formatDate(data.range.to)} · so với ${formatDate(data.previousRange.from)} – ${formatDate(data.previousRange.to)}`
            : "Theo dõi hiệu quả kinh doanh theo từng khoảng thời gian."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={mode}
              onChange={(event) => handleModeChange(event.target.value as RangeMode)}
              className="h-8 rounded-md border border-line bg-paper px-2.5 text-xs font-semibold text-ink"
              aria-label="Khoảng thời gian thống kê"
            >
              {PERIOD_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => data && exportCsv(data)}
              disabled={!data || isFetching}
            >
              <Download aria-hidden />
              CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? "animate-spin" : undefined} aria-hidden />
              Làm mới
            </Button>
            {isFetching && !isLoading ? (
              <span className="text-[11px] text-muted">Đang cập nhật…</span>
            ) : null}
          </div>
        }
      />

      {mode === "custom" ? (
        <Card className="mb-4">
          <CardBody className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="grid gap-1">
              <Label htmlFor="stats-from">Từ ngày</Label>
              <Input
                id="stats-from"
                type="date"
                value={draftFrom}
                max={draftTo || todayReportDate()}
                onChange={(event) => setDraftFrom(event.target.value)}
                className="w-44"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="stats-to">Đến ngày</Label>
              <Input
                id="stats-to"
                type="date"
                value={draftTo}
                min={draftFrom || undefined}
                onChange={(event) => setDraftTo(event.target.value)}
                className="w-44"
              />
            </div>
            <Button size="sm" onClick={applyCustomRange}>Áp dụng</Button>
            {rangeError ? (
              <p role="alert" className="text-xs font-medium text-danger">{rangeError}</p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {isError ? (
        <Card className="mb-4">
          <ErrorState
            title="Không thể tải dữ liệu thống kê"
            description={error instanceof Error ? error.message : "Vui lòng thử lại."}
            onRetry={() => void refetch()}
          />
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            icon={metric.icon}
            tone={metric.tone}
            loading={isLoading}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title="Doanh thu theo ngày"
            description="Không tính đơn đã hủy · rê chuột để xem chi tiết"
          />
          <CardBody>
            {isLoading ? (
              <div className="h-64 animate-pulse rounded bg-canvas-line" />
            ) : data && data.daily.length && data.totals.orders > 0 ? (
              <>
                <div className="flex h-64 items-stretch gap-[2px]">
                  {data.daily.map((day, index) => {
                    const step = Math.max(1, Math.ceil(data.daily.length / 6));
                    const showLabel = index % step === 0 || index === data.daily.length - 1;
                    const height = day.revenue > 0 ? Math.max(2, (day.revenue / maxRevenue) * 100) : 1;

                    return (
                      <div key={day.date} className="group flex min-w-0 flex-1 flex-col">
                        <div className="relative flex flex-1 items-end">
                          <div
                            className="relative w-full rounded-t-sm bg-brand/70 transition-colors group-hover:bg-brand"
                            style={{ height: `${height}%` }}
                            role="img"
                            aria-label={`${formatDate(day.date)}: ${formatCurrency(day.revenue)}, ${day.orders} đơn`}
                            title={`${formatDate(day.date)} · ${formatCurrency(day.revenue)} · ${day.orders} đơn`}
                          >
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-ink px-2 py-1 text-[10px] whitespace-nowrap text-white group-hover:block">
                              {formatCurrency(day.revenue)} · {day.orders} đơn
                            </span>
                          </div>
                        </div>
                        <span className="mt-2 h-4 overflow-hidden text-center text-[10px] text-muted">
                          {showLabel ? day.label : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-semibold text-brand">
                    Xem bảng số liệu
                  </summary>
                  <div className="mt-3 max-h-64 overflow-auto rounded-md border border-line">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-canvas-soft text-[10px] tracking-wider text-muted uppercase">
                        <tr>
                          <th className="px-3 py-2">Ngày</th>
                          <th className="px-3 py-2 text-right">Doanh thu</th>
                          <th className="px-3 py-2 text-right">Đơn</th>
                          <th className="px-3 py-2 text-right">Sản phẩm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-canvas-line">
                        {data.daily.map((day) => (
                          <tr key={day.date}>
                            <td className="px-3 py-1.5 text-muted">{formatDate(day.date)}</td>
                            <td className="px-3 py-1.5 text-right font-medium text-ink">{formatCurrency(day.revenue)}</td>
                            <td className="px-3 py-1.5 text-right text-muted">{formatNumber(day.orders)}</td>
                            <td className="px-3 py-1.5 text-right text-muted">{formatNumber(day.unitsSold)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            ) : (
              <p className="grid h-64 place-items-center text-sm text-muted">
                Chưa có đơn hàng trong kỳ.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Sản phẩm bán chạy"
            description="Xếp theo số lượng đã bán · không tính đơn hủy · doanh thu gộp"
            action={
              <Link href="/admin/products" className="text-xs font-semibold text-brand hover:underline">
                Sản phẩm
              </Link>
            }
          />
          <CardBody className="p-0">
            {isLoading ? (
              <div className="grid gap-3 p-5">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="h-11 animate-pulse rounded bg-canvas-line" />
                ))}
              </div>
            ) : data?.topProducts.length ? (
              <ol className="divide-y divide-canvas-line">
                {data.topProducts.map((product, index) => (
                  <li key={product.productId} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-canvas-line text-xs font-bold text-muted">
                      {index + 1}
                    </span>
                    <ProductThumb src={product.thumbnail} alt={product.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/products/${product.productId}`}
                        className="block truncate py-0.5 text-sm font-semibold text-ink hover:text-brand"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted">{formatNumber(product.units)} sản phẩm</p>
                    </div>
                    <span className="text-xs font-semibold text-ink">
                      {formatCurrency(product.revenue)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-5 py-16 text-center text-sm text-muted">Chưa có dữ liệu bán hàng.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Trạng thái đơn hàng"
            description={`${formatNumber(totalOrdersInRange)} đơn trong kỳ · tính cả đơn hủy`}
          />
          <CardBody>
            {isLoading ? (
              <div className="grid gap-4">
                {[0, 1, 2, 3, 4].map((row) => (
                  <div key={row} className="h-5 animate-pulse rounded bg-canvas-line" />
                ))}
              </div>
            ) : (
              <ul className="grid gap-3.5">
                {(data?.statusBreakdown ?? []).map((row) => (
                  <li key={row.status} className="grid grid-cols-[112px_1fr_48px] items-center gap-3">
                    <OrderStatusBadge status={row.status} />
                    <div className="h-1.5 overflow-hidden rounded-full bg-canvas-line">
                      <div
                        className={`h-full rounded-full ${STATUS_BAR[row.status] ?? "bg-ink"}`}
                        style={{ width: `${row.orders ? Math.max(2, row.percent) : 0}%` }}
                      />
                    </div>
                    <span className="text-right text-xs font-semibold text-ink">
                      {formatNumber(row.orders)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tóm tắt trong kỳ" description="Các chỉ số bổ sung của kỳ đang chọn" />
          <CardBody>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold tracking-wider text-muted uppercase">Giá trị đơn trung bình</dt>
                <dd className="mt-1 text-lg font-semibold text-ink">
                  {data ? formatCurrency(data.totals.averageOrderValue) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold tracking-wider text-muted uppercase">Tổng giảm giá</dt>
                <dd className="mt-1 text-lg font-semibold text-ink">
                  {data ? formatCurrency(data.totals.discountTotal) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold tracking-wider text-muted uppercase">Phí vận chuyển thu được</dt>
                <dd className="mt-1 text-lg font-semibold text-ink">
                  {data ? formatCurrency(data.totals.shippingTotal) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold tracking-wider text-muted uppercase">Đơn đã hủy</dt>
                <dd className="mt-1 text-lg font-semibold text-ink">
                  {data ? formatNumber(cancelledOrders) : "—"}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
