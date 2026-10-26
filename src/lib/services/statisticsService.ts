import type { StatisticsPeriod, StatisticsSummary } from "@/src/types";
import { api } from "./http";

export type StatisticsQuery =
  | { period: StatisticsPeriod }
  | { from: string; to: string };

export const statisticsService = {
  getSummary(query: StatisticsQuery): Promise<StatisticsSummary> {
    const params = new URLSearchParams();
    if ("period" in query) {
      params.set("period", String(query.period));
    } else {
      params.set("from", query.from);
      params.set("to", query.to);
    }
    return api.get<StatisticsSummary>(`/api/admin/statistics?${params.toString()}`);
  },
};
