const fs = require('fs');
const path = require('path');
const https = require('https');

const CACHE_DIR = path.join(__dirname, '..', 'data');
const CACHE_FILE_PATH = path.join(CACHE_DIR, 'earthquakes_cache.json');
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_MIN_MAGNITUDE = 6.0;
const DEFAULT_START_DATE = '2000-01-01';

const fetchImpl =
  typeof global.fetch === 'function'
    ? global.fetch.bind(global)
    : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const fetchNode =
  typeof global.fetch === 'function'
    ? (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
    : null;

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function toValidDateString(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString().slice(0, 10);
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isDateOnlyText(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function addOneDayDateOnly(dateText) {
  const ms = Date.parse(`${dateText}T00:00:00Z`);
  if (!Number.isFinite(ms)) return dateText;
  const d = new Date(ms);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function toBeijingDayStartUtcIso(dateText) {
  return new Date(Date.parse(`${dateText}T00:00:00+08:00`)).toISOString();
}

function toBeijingNextDayStartUtcIso(dateText) {
  const nextDay = addOneDayDateOnly(dateText);
  return new Date(Date.parse(`${nextDay}T00:00:00+08:00`)).toISOString();
}

function normalizeUsgsDateRange(start, end) {
  if (!isDateOnlyText(start) || !isDateOnlyText(end)) {
    return { starttime: start, endtime: end };
  }
  // Treat client date as Beijing local date, then convert to UTC.
  // Use half-open interval [start, endNextDay) so same-day query covers full day.
  return {
    starttime: toBeijingDayStartUtcIso(start),
    endtime: toBeijingNextDayStartUtcIso(end)
  };
}

function getFetchErrorMessage(error) {
  const base = error?.message || String(error);
  const causeCode = error?.cause?.code || '';
  if (causeCode) return `${base} (${causeCode})`;
  return base;
}

function buildUsgsUrl({ start, end, minMag, maxMag, orderBy = 'time', limit }) {
  const usgsUrl = new URL('https://earthquake.usgs.gov/fdsnws/event/1/query');
  const { starttime, endtime } = normalizeUsgsDateRange(start, end);
  usgsUrl.searchParams.set('format', 'geojson');
  usgsUrl.searchParams.set('starttime', starttime);
  usgsUrl.searchParams.set('endtime', endtime);
  usgsUrl.searchParams.set('minmagnitude', String(Math.max(0, minMag)));
  if (Number.isFinite(maxMag)) {
    usgsUrl.searchParams.set('maxmagnitude', String(Math.max(0, maxMag)));
  }
  if (orderBy) usgsUrl.searchParams.set('orderby', orderBy);
  if (Number.isFinite(limit)) usgsUrl.searchParams.set('limit', String(limit));
  return usgsUrl;
}

async function fetchUsgsJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response;
    try {
      response = await fetchImpl(url, { signal: controller.signal });
    } catch (firstError) {
      if (!fetchNode) throw firstError;
      const agent = new https.Agent({ family: 4 });
      response = await fetchNode(url, { timeout: timeoutMs, agent });
    }

    if (!response.ok) {
      const error = new Error(`USGS upstream status: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function dedupeFeatures(features) {
  const map = new Map();
  for (const feature of features || []) {
    if (!feature || typeof feature !== 'object') continue;
    const id = feature.id || feature?.properties?.code;
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, feature);
      continue;
    }

    const oldTime = Number(map.get(id)?.properties?.time || 0);
    const newTime = Number(feature?.properties?.time || 0);
    if (newTime >= oldTime) map.set(id, feature);
  }

  return Array.from(map.values()).sort((a, b) => {
    const at = Number(a?.properties?.time || 0);
    const bt = Number(b?.properties?.time || 0);
    return bt - at;
  });
}

function createFeatureCollection(features, metadata = {}) {
  return {
    type: 'FeatureCollection',
    metadata,
    features: dedupeFeatures(features)
  };
}

async function ensureCacheDir() {
  await fs.promises.mkdir(CACHE_DIR, { recursive: true });
}

let writeQueue = Promise.resolve();
async function writeCacheAtomic(payload) {
  await ensureCacheDir();
  const normalized = createFeatureCollection(payload?.features || [], payload?.metadata || {});
  const tempPath = `${CACHE_FILE_PATH}.tmp`;
  writeQueue = writeQueue.then(async () => {
    await fs.promises.writeFile(tempPath, JSON.stringify(normalized, null, 2), 'utf8');
    await fs.promises.rename(tempPath, CACHE_FILE_PATH);
  });
  return writeQueue;
}

async function readCacheSafe() {
  const raw = await fs.promises.readFile(CACHE_FILE_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (parsed?.type !== 'FeatureCollection' || !Array.isArray(parsed?.features)) {
    throw new Error('Invalid cache file format');
  }
  return createFeatureCollection(parsed.features, parsed.metadata || {});
}

function filterFeatures(features, query = {}) {
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 29);

  const start = toValidDateString(query.start, defaultStart.toISOString().slice(0, 10));
  const end = toValidDateString(query.end, now.toISOString().slice(0, 10));
  const minMag = toNumber(query.minMag, 5.5);
  const maxMag = toNumber(query.maxMag, Infinity);
  const limitRaw = toNumber(query.limit, 100);
  const limit = Math.max(1, Math.min(2000, Math.floor(limitRaw)));

  // Align cache fallback filtering with Beijing day boundaries [start, endNextDay).
  const startMs = Date.parse(`${start}T00:00:00+08:00`);
  const endExclusiveMs = Date.parse(`${addOneDayDateOnly(end)}T00:00:00+08:00`);

  return (features || [])
    .filter((feature) => {
      const time = Number(feature?.properties?.time);
      const mag = Number(feature?.properties?.mag);
      if (!Number.isFinite(time) || !Number.isFinite(mag)) return false;
      if (time < startMs || time >= endExclusiveMs) return false;
      if (mag < minMag) return false;
      if (Number.isFinite(maxMag) && mag > maxMag) return false;
      return true;
    })
    .slice(0, limit);
}

async function prefetchAll({
  startDate = DEFAULT_START_DATE,
  endDate = getTodayDateString(),
  minMagnitude = DEFAULT_MIN_MAGNITUDE
} = {}) {
  const startYear = new Date(startDate).getUTCFullYear();
  const endYear = new Date(endDate).getUTCFullYear();
  const allFeatures = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const yearStart = year === startYear ? startDate : `${year}-01-01`;
    const yearEnd = year === endYear ? endDate : `${year}-12-31`;
    const usgsUrl = buildUsgsUrl({
      start: yearStart,
      end: yearEnd,
      minMag: minMagnitude,
      maxMag: Infinity,
      orderBy: 'time-asc'
    });
    const data = await fetchUsgsJson(usgsUrl.toString(), 15000);
    const features = Array.isArray(data?.features) ? data.features : [];
    allFeatures.push(...features);
  }

  const payload = createFeatureCollection(allFeatures, {
    generatedAt: new Date().toISOString(),
    source: 'USGS',
    startDate,
    endDate,
    minMagnitude
  });
  await writeCacheAtomic(payload);
  return payload;
}

async function fetchRealtimeAndUpdateCache(query) {
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 29);

  const start = toValidDateString(query.start, defaultStart.toISOString().slice(0, 10));
  const end = toValidDateString(query.end, now.toISOString().slice(0, 10));
  const minMag = toNumber(query.minMag, 5.5);
  const maxMag = toNumber(query.maxMag, Infinity);
  const limitRaw = toNumber(query.limit, 100);
  const limit = Math.max(1, Math.min(2000, Math.floor(limitRaw)));

  const usgsUrl = buildUsgsUrl({
    start,
    end,
    minMag,
    maxMag,
    orderBy: 'time',
    limit
  });
  const liveData = await fetchUsgsJson(usgsUrl.toString(), 10000);
  const liveFeatures = Array.isArray(liveData?.features) ? liveData.features : [];

  void (async () => {
    try {
      let existing = [];
      try {
        const cache = await readCacheSafe();
        existing = cache.features;
      } catch (_) {
        existing = [];
      }
      const merged = createFeatureCollection([...existing, ...liveFeatures], {
        ...(liveData.metadata || {}),
        updatedAt: new Date().toISOString(),
        source: 'USGS realtime+cache merge'
      });
      await writeCacheAtomic(merged);
    } catch (error) {
      console.error('[earthquakes-cache] async cache update failed:', getFetchErrorMessage(error));
    }
  })();

  return {
    ...liveData,
    features: liveFeatures
  };
}

async function isCacheStale(maxAgeMs = CACHE_MAX_AGE_MS) {
  try {
    const stat = await fs.promises.stat(CACHE_FILE_PATH);
    return Date.now() - stat.mtimeMs > maxAgeMs;
  } catch (_) {
    return true;
  }
}

module.exports = {
  CACHE_FILE_PATH,
  CACHE_MAX_AGE_MS,
  DEFAULT_MIN_MAGNITUDE,
  DEFAULT_START_DATE,
  filterFeatures,
  fetchRealtimeAndUpdateCache,
  getFetchErrorMessage,
  isCacheStale,
  prefetchAll,
  readCacheSafe,
  writeCacheAtomic
};
