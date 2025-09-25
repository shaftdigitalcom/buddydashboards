export type RevenueSeriesPoint = {
  date: string;
  value: number;
};

export type RevenueMetricResponse = {
  data: {
    total: number;
    previousTotal: number;
    trendPercentage: number | null;
    series: RevenueSeriesPoint[];
    uniqueLeads: number;
    previousUniqueLeads: number;
    generatedAt: string;
    range: {
      currentFrom: string;
      currentTo: string;
      previousFrom: string;
      previousTo: string;
    };
  };
  context: {
    timezone: string;
    currency: string;
    filters: {
      pipelineIds?: number[];
      userIds?: number[];
      statusIds?: number[];
      stageLabel: string;
      stageRaw: string;
    };
    range: {
      label: string;
      currentFrom: string;
      currentTo: string;
      previousFrom: string;
      previousTo: string;
    };
  };
  cache: {
    hit: boolean;
    cachedAt: string | null;
    expiresAt: string | null;
    forceApplied: boolean;
    cooldownRemainingSeconds: number;
  };
};
