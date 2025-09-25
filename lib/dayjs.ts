import dayjs, { type ConfigType } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

let configured = false;

function ensureConfigured() {
  if (!configured) {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    configured = true;
  }
}

export function getDayjs() {
  ensureConfigured();
  return dayjs;
}

export function dayjsTz(date?: ConfigType, tz?: string) {
  ensureConfigured();
  return tz ? dayjs(date).tz(tz) : dayjs(date);
}
