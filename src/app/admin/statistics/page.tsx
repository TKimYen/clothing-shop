"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, CircleDollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/src/components/admin/layout";
import { Button, Card, CardBody, CardHeader } from "@/src/components/ui";
import { api } from "@/src/lib/services/http";
import type { StatisticsSummary } from "@/src/lib/services/dashboardService";
import { formatCurrency, formatNumber } from "@/src/lib/utils";

const periods = [
  { value: 7, label: "7 ngày" },
  { value: 30, label: "30 ngày" },
  { value: 90, label: "90 ngày" },
];

export default function StatisticsPage() {
  const [period, setPeriod] = useState(30);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["statistics", period],
    queryFn: () => api.get<StatisticsSummary>(`/api/admin/statistics?period=${period}`),
  });
  const maxRevenue = Math.max(1, ...(data?.daily.map((day) => day.revenue) ?? []));
  const stats = [
    { label: "Doanh thu", value: data ? formatCurrency(data.totals.revenue) : "—", icon: CircleDollarSign, tone: "bg-gold/15 text-gold" },
    { label: "Đơn hàng", value: data ? formatNumber(data.totals.orders) : "—", icon: ShoppingCart, tone: "bg-plum/10 text-plum" },
    { label: "Khách hàng mới", value: data ? formatNumber(data.totals.customers) : "—", icon: Users, tone: "bg-brand/10 text-brand" },
    { label: "Sản phẩm đã bán", value: data ? formatNumber(data.totals.unitsSold) : "—", icon: Package, tone: "bg-azure/10 text-azure" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Statistics"
        description="Theo dõi hiệu quả kinh doanh theo từng khoảng thời gian."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(event) => setPeriod(Number(event.target.value))}
              className="h-9 rounded-md border border-line bg-paper px-3 text-xs font-semibold text-ink"
              aria-label="Khoảng thời gian thống kê"
            >
              {periods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>Refresh</Button>
          </div>
        }
      />

      {isError ? (
        <Card><CardBody><p className="text-sm text-danger">Không thể tải dữ liệu thống kê.</p><Button className="mt-3" size="sm" onClick={() => void refetch()}>Thử lại</Button></CardBody></Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return <Card key={stat.label}><CardBody className="p-4"><span className={`grid size-8 place-items-center rounded-lg ${stat.tone}`}><Icon className="size-4" /></span><p className="mt-3 text-xs text-muted">{stat.label}</p><p className="mt-0.5 font-display text-xl font-bold text-ink">{isLoading ? "…" : stat.value}</p></CardBody></Card>;
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Doanh thu theo ngày" description={`Trong ${period} ngày gần nhất, không tính đơn đã hủy`} />
          <CardBody>
            {isLoading ? <div className="h-64 animate-pulse rounded bg-canvas-line" /> : (
              <div className="flex h-64 items-end gap-1.5 overflow-x-auto border-b border-line pb-0">
                {data?.daily.map((day) => (
                  <div key={day.date} className="group flex min-w-3 flex-1 flex-col items-center justify-end gap-1 self-stretch">
                    <span className="pointer-events-none rounded bg-ink px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">{formatCurrency(day.revenue)}</span>
                    <div className="w-full min-w-2 rounded-t bg-brand/75 transition-colors group-hover:bg-brand" style={{ height: `${Math.max(day.revenue ? 4 : 1, (day.revenue / maxRevenue) * 82)}%` }} title={`${day.date}: ${formatCurrency(day.revenue)}`} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Sản phẩm bán chạy" description="Xếp theo số lượng đã bán" action={<Link href="/admin/products" className="text-xs font-semibold text-brand hover:underline">Sản phẩm</Link>} />
          <CardBody>
            {data?.topProducts.length ? <ol className="grid gap-3">{data.topProducts.map((product, index) => <li key={product.name} className="flex items-center gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-canvas-line text-xs font-bold text-muted">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{product.name}</p><p className="text-xs text-muted">{formatNumber(product.units)} sản phẩm</p></div><span className="text-xs font-semibold text-ink">{formatCurrency(product.revenue)}</span></li>)}</ol> : <p className="py-12 text-center text-sm text-muted">Chưa có dữ liệu bán hàng.</p>}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Tóm tắt đơn hàng" description="Giá trị trung bình trên mỗi đơn hàng" />
        <CardBody className="flex items-center gap-3"><BarChart3 className="size-5 text-brand" /><p className="text-sm text-muted">Giá trị đơn trung bình:</p><strong className="text-lg text-ink">{data ? formatCurrency(data.totals.averageOrderValue) : "—"}</strong></CardBody>
      </Card>
    </>
  );
}
