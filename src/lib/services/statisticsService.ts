import type { StatisticsPeriod, StatisticsSummary } from "@/src/types";
import { api } from "./http";

export type StatisticsQuery =
  | { period: StatisticsPeriod }
  | { from: string; to: string };

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateKey(value: string): boolean {
  if (!DATE_KEY_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
}

export const statisticsService = {
  getSummary(query: StatisticsQuery): Promise<StatisticsSummary> {
    const params = new URLSearchParams();
    if ("period" in query) {
      const period = Number(query.period);
      if (![7, 30, 90].includes(period)) {
        throw new Error("Khoảng thời gian không hợp lệ");
      }
      params.set("period", String(period));
    } else {
      const from = query.from?.trim();
      const to = query.to?.trim();
      if (!from || !to) {
        throw new Error("Thiếu ngày bắt đầu hoặc kết thúc");
      }
      if (!isValidDateKey(from) || !isValidDateKey(to)) {
        throw new Error("Định dạng ngày không hợp lệ (YYYY-MM-DD)");
      }
      if (from > to) {
        throw new Error("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
      }
      params.set("from", from);
      params.set("to", to);
    }
    return api.get<StatisticsSummary>(`/api/admin/statistics?${params.toString()}`);
  },
};
