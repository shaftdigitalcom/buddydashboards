import type { Dayjs } from "dayjs";

import { getDayjs, dayjsTz } from "../dayjs";
import type { KommoAuth } from "../kommo";
import {
  fetchLeadStatusChangedEvents,
  fetchLeadsByIds,
  type KommoEvent,
  type KommoLead
} from "../kommoData";

const dayjs = getDayjs();

type RevenueRange = {
  currentFrom: Dayjs;
  currentTo: Dayjs;
  previousFrom: Dayjs;
  previousTo: Dayjs;
};

type RevenueFilters = {
  pipelineIds?: number[];
  userIds?: number[];
  statusIds?: number[];
};

export type RevenueComputationParams = {
  accountDomain: string;
  auth: KommoAuth;
  timezone: string;
  range: RevenueRange;
  filters: RevenueFilters;
};

export type RevenueSeriesPoint = {
  date: string;
  value: number;
};

export type RevenueComputationResult = {
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

function buildLeadMap(leads: KommoLead[]): Map<number, KommoLead> {
  return new Map(leads.map((lead) => [lead.id, lead]));
}

function eventMatchesFilters(
  event: KommoEvent,
  lead: KommoLead | undefined,
  filters: RevenueFilters
): boolean {
  const pipelineId = event.value_after?.pipeline_id ?? lead?.pipeline_id ?? null;
  const statusId = event.value_after?.status_id ?? lead?.status_id ?? null;
  const responsibleId = event.value_after?.responsible_user_id ?? lead?.responsible_user_id ?? null;

  if (filters.pipelineIds?.length) {
    if (!pipelineId || !filters.pipelineIds.includes(pipelineId)) {
      return false;
    }
  }

  if (filters.statusIds?.length) {
    if (!statusId || !filters.statusIds.includes(statusId)) {
      return false;
    }
  }

  if (filters.userIds?.length) {
    if (!responsibleId || !filters.userIds.includes(responsibleId)) {
      return false;
    }
  }

  return true;
}

function deduplicateByLead(events: KommoEvent[]): KommoEvent[] {
  const ordered = [...events].sort((a, b) => a.created_at - b.created_at);
  const selected = new Map<number, KommoEvent>();

  for (const event of ordered) {
    if (!selected.has(event.entity_id)) {
      selected.set(event.entity_id, event);
    }
  }

  return Array.from(selected.values());
}

function sumEvents(
  events: KommoEvent[],
  leadMap: Map<number, KommoLead>,
  timezone: string
): { total: number; buckets: Map<string, number> } {
  const buckets = new Map<string, number>();
  let total = 0;

  for (const event of events) {
    const lead = leadMap.get(event.entity_id);
    const price = lead?.price ?? 0;
    total += price;

    const dateKey = dayjsTz(event.created_at * 1000, timezone)
      .startOf("day")
      .format("YYYY-MM-DD");

    buckets.set(dateKey, (buckets.get(dateKey) ?? 0) + price);
  }

  return { total, buckets };
}

function buildSeries(
  buckets: Map<string, number>,
  range: RevenueRange,
  timezone: string
): RevenueSeriesPoint[] {
  const series: RevenueSeriesPoint[] = [];

  let cursor = dayjsTz(range.currentFrom.valueOf(), timezone).startOf("day");
  const end = dayjsTz(range.currentTo.valueOf(), timezone).startOf("day");

  while (cursor.isSame(end) || cursor.isBefore(end)) {
    const key = cursor.format("YYYY-MM-DD");
    series.push({
      date: key,
      value: buckets.get(key) ?? 0,
    });
    cursor = cursor.add(1, "day");
  }

  return series;
}

function filterEventsByRange(
  events: KommoEvent[],
  range: { from: number; to: number }
): KommoEvent[] {
  return events.filter((event) => {
    const createdAtMs = event.created_at * 1000;
    return createdAtMs >= range.from && createdAtMs <= range.to;
  });
}

export async function computeRevenueMetric(
  params: RevenueComputationParams
): Promise<RevenueComputationResult> {
  const { accountDomain, auth, timezone, range, filters } = params;

  const combinedFrom = Math.floor(Math.min(range.previousFrom.valueOf(), range.currentFrom.valueOf()));
  const combinedTo = Math.floor(Math.max(range.previousTo.valueOf(), range.currentTo.valueOf()));

  const events = await fetchLeadStatusChangedEvents(accountDomain, auth, {
    from: combinedFrom / 1000,
    to: combinedTo / 1000,
  });

  const leadIds = Array.from(new Set(events.map((event) => event.entity_id)));
  const leads = await fetchLeadsByIds(accountDomain, auth, leadIds);
  const leadMap = buildLeadMap(leads);

  const currentEventsRaw = filterEventsByRange(events, {
    from: range.currentFrom.valueOf(),
    to: range.currentTo.valueOf(),
  });
  const previousEventsRaw = filterEventsByRange(events, {
    from: range.previousFrom.valueOf(),
    to: range.previousTo.valueOf(),
  });

  const currentFiltered = currentEventsRaw.filter((event) =>
    eventMatchesFilters(event, leadMap.get(event.entity_id), filters)
  );
  const previousFiltered = previousEventsRaw.filter((event) =>
    eventMatchesFilters(event, leadMap.get(event.entity_id), filters)
  );

  const currentEvents = deduplicateByLead(currentFiltered);
  const previousEvents = deduplicateByLead(previousFiltered);

  const currentSummary = sumEvents(currentEvents, leadMap, timezone);
  const previousSummary = sumEvents(previousEvents, leadMap, timezone);

  const trendPercentage = previousSummary.total
    ? ((currentSummary.total - previousSummary.total) / previousSummary.total) * 100
    : null;

  const series = buildSeries(currentSummary.buckets, range, timezone);

  return {
    total: currentSummary.total,
    previousTotal: previousSummary.total,
    trendPercentage,
    series,
    uniqueLeads: currentEvents.length,
    previousUniqueLeads: previousEvents.length,
    generatedAt: dayjs().toISOString(),
    range: {
      currentFrom: range.currentFrom.toISOString(),
      currentTo: range.currentTo.toISOString(),
      previousFrom: range.previousFrom.toISOString(),
      previousTo: range.previousTo.toISOString(),
    },
  };
}

