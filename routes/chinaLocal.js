const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const CSV_FILE_PATH = path.join(__dirname, '..', 'data', 'china-earthquake.csv');

let cachedFeatures = null;
let cacheError = null;
let cacheLoadedAt = null;

function splitCsvLine(line) {
  const cells = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(cell);
      cell = '';
    } else {
      cell += ch;
    }
  }

  cells.push(cell);
  return cells.map((v) => String(v || '').trim());
}

function normalizeHeaderName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, '')
    .replace(/_/g, '')
    .replace(/-/g, '');
}

function buildHeaderIndex(headers) {
  const headerMap = new Map();
  headers.forEach((raw, idx) => headerMap.set(normalizeHeaderName(raw), idx));

  const aliases = {
    time: ['time', 'origin_time', 'origintime', 'date', 'datetime'],
    latitude: ['latitude', 'lat'],
    longitude: ['longitude', 'lng', 'lon'],
    depth: ['depth', 'depthkm', 'depth_km'],
    magnitude: ['magnitude', 'mag', 'ml'],
    place: ['place', 'location']
  };

  const index = {};
  for (const [key, names] of Object.entries(aliases)) {
    const hit = names.map(normalizeHeaderName).find((n) => headerMap.has(n));
    if (hit) index[key] = headerMap.get(hit);
  }

  // Fallback for known CSV layout:
  // 0=time, 1=longitude, 2=latitude, 3=depth, 4=place, 5=magnitude
  if (!Number.isInteger(index.time)) index.time = 0;
  if (!Number.isInteger(index.longitude)) index.longitude = 1;
  if (!Number.isInteger(index.latitude)) index.latitude = 2;
  if (!Number.isInteger(index.depth)) index.depth = 3;
  if (!Number.isInteger(index.place)) index.place = 4;
  if (!Number.isInteger(index.magnitude)) index.magnitude = 5;

  return index;
}

function parseNumber(value) {
  const n = Number(String(value ?? '').trim());
  return Number.isFinite(n) ? n : null;
}

function parseTimeMs(value) {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const normalized = s.includes('T') ? s : s.replace(' ', 'T');
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/.test(normalized);
  const withTimezone = hasTimezone ? normalized : `${normalized}+08:00`;
  const ms = Date.parse(withTimezone);
  return Number.isFinite(ms) ? ms : null;
}

function isDateOnlyText(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function ensureRequiredHeaders(index) {
  const required = ['time', 'latitude', 'longitude', 'magnitude'];
  return required.every((key) => Number.isInteger(index[key]));
}

function toFeature(row, rowNumber, index) {
  const timeMs = parseTimeMs(row[index.time]);
  const lat = parseNumber(row[index.latitude]);
  const lon = parseNumber(row[index.longitude]);
  const depth = parseNumber(row[index.depth]);
  const mag = parseNumber(row[index.magnitude]);
  const placeRaw = row[index.place];
  const place = String(placeRaw == null ? '' : placeRaw).trim() || 'China local quake';

  if (!Number.isFinite(timeMs) || !Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(mag)) {
    return null;
  }

  const dep = Number.isFinite(depth) ? depth : 0;
  const id = `cn-${timeMs}-${lon.toFixed(4)}-${lat.toFixed(4)}-${rowNumber}`;

  return {
    type: 'Feature',
    id,
    properties: {
      mag,
      place,
      time: timeMs,
      tsunami: 0
    },
    geometry: {
      type: 'Point',
      coordinates: [lon, lat, dep]
    }
  };
}

function loadCsvToCache() {
  try {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file does not exist: ${CSV_FILE_PATH}`);
    }

    const stat = fs.statSync(CSV_FILE_PATH);
    if (!stat.isFile()) {
      throw new Error(`CSV path is not a file: ${CSV_FILE_PATH}`);
    }
    if (stat.size <= 0) {
      throw new Error(`CSV file is empty: ${CSV_FILE_PATH}`);
    }

    const raw = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const lines = raw
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      throw new Error(`CSV has no data rows: ${CSV_FILE_PATH}`);
    }

    const headers = splitCsvLine(lines[0]);
    const index = buildHeaderIndex(headers);
    if (!ensureRequiredHeaders(index)) {
      throw new Error(
        `CSV header mapping failed. required=[time,latitude,longitude,magnitude], headers=${JSON.stringify(
          headers
        )}, mapped=${JSON.stringify(index)}`
      );
    }

    const features = [];
    for (let i = 1; i < lines.length; i += 1) {
      const row = splitCsvLine(lines[i]);
      const feature = toFeature(row, i, index);
      if (feature) features.push(feature);
    }

    if (features.length === 0) {
      throw new Error('CSV parsed but produced zero valid records');
    }

    cachedFeatures = features;
    cacheError = null;
    cacheLoadedAt = Date.now();
    console.log(
      `[china-local] cache loaded: file=${CSV_FILE_PATH}, bytes=${stat.size}, rows=${lines.length - 1}, features=${features.length}`
    );
  } catch (error) {
    cachedFeatures = null;
    cacheError = error;
    cacheLoadedAt = null;
    console.error('[china-local] cache load failed:', {
      file: CSV_FILE_PATH,
      error: error.message,
      stack: error.stack
    });
  }
}

function filterByQuery(features, query) {
  const startText = String(query.start || '').trim();
  const endText = String(query.end || '').trim();
  const startMs = startText
    ? isDateOnlyText(startText)
      ? Date.parse(`${startText}T00:00:00+08:00`)
      : Date.parse(startText)
    : null;
  let endMs = null;
  if (endText) {
    if (isDateOnlyText(endText)) {
      endMs = Date.parse(`${endText}T23:59:59.999+08:00`);
    } else {
      endMs = Date.parse(endText);
    }
  }
  const minMag = Number.isFinite(Number(query.minMag)) ? Number(query.minMag) : null;
  const maxMag = Number.isFinite(Number(query.maxMag)) ? Number(query.maxMag) : null;

  return features.filter((feature) => {
    const t = Number(feature?.properties?.time);
    const m = Number(feature?.properties?.mag);
    if (!Number.isFinite(t) || !Number.isFinite(m)) return false;
    if (Number.isFinite(startMs) && t < startMs) return false;
    if (Number.isFinite(endMs) && t > endMs) return false;
    if (minMag !== null && m < minMag) return false;
    if (maxMag !== null && m > maxMag) return false;
    return true;
  });
}

loadCsvToCache();

router.get('/local/test', (req, res) => {
  res.json({
    status: 'ok',
    route: '/api/china-earthquakes/local/test',
    cacheReady: Array.isArray(cachedFeatures),
    cacheSize: Array.isArray(cachedFeatures) ? cachedFeatures.length : 0,
    cacheLoadedAt,
    csvFile: CSV_FILE_PATH,
    csvExists: fs.existsSync(CSV_FILE_PATH)
  });
});

router.get('/local', (req, res) => {
  try {
    if (!cachedFeatures) {
      const message = cacheError ? cacheError.message : 'CSV cache not initialized';
      console.error('[china-local] /local requested but cache unavailable:', {
        query: req.query,
        message
      });
      return res.status(500).json({
        error: 'China local data unavailable',
        message
      });
    }

    const features = filterByQuery(cachedFeatures, req.query);
    return res.json({
      type: 'FeatureCollection',
      features,
      metadata: {
        source: 'china-local-csv',
        totalCached: cachedFeatures.length,
        filteredCount: features.length,
        cacheLoadedAt
      }
    });
  } catch (error) {
    console.error('[china-local] /local handler failed:', {
      query: req.query,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      error: 'Failed to process local earthquake data',
      message: error.message
    });
  }
});

module.exports = router;
