const express = require('express');
const fs = require('fs');
const path = require('path');
const { generateEarthquakeSummary } = require('../services/aiService');
const { escapeCSV } = require('../utils/csv');

const router = express.Router();
const CACHE_FILE_PATH = path.join(__dirname, '..', 'ai_summary_cache.csv');
const CSV_HEADERS = ['earthquake_id', 'mag', 'place', 'depth', 'time', 'summary_text', 'created_at'];

function ensureCacheFile() {
  if (!fs.existsSync(CACHE_FILE_PATH)) {
    fs.writeFileSync(CACHE_FILE_PATH, `${CSV_HEADERS.join(',')}\n`, 'utf8');
  }
}

function parseCsv(content = '') {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];

    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && content[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += ch;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.length > 0 && !(r.length === 1 && r[0] === ''));
}

function readSummaryFromCsv(earthquakeId) {
  ensureCacheFile();
  const content = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
  const rows = parseCsv(content);
  if (rows.length <= 1) return null;

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (row[0] === earthquakeId) {
      return row[5] || '';
    }
  }

  return null;
}

function appendSummaryToCsv(record) {
  try {
    ensureCacheFile();
    const line = [
      record.earthquake_id,
      record.mag,
      record.place,
      record.depth,
      record.time,
      record.summary_text,
      record.created_at
    ]
      .map(escapeCSV)
      .join(',');
    fs.appendFileSync(CACHE_FILE_PATH, `${line}\n`, 'utf8');
    const size = fs.statSync(CACHE_FILE_PATH).size;
    console.log(
      `[summary] cache write success: path=${CACHE_FILE_PATH}, earthquake_id=${record.earthquake_id}, bytes=${size}`
    );
  } catch (error) {
    console.error('[summary] cache write failed:', {
      path: CACHE_FILE_PATH,
      earthquake_id: record?.earthquake_id,
      message: error?.message,
      stack: error?.stack
    });
    throw error;
  }
}

router.post('/', async (req, res) => {
  try {
    const { id, mag, place, depth, time, lat, lng } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: 'Missing required field: id' });
    }

    const quakeId = String(id);
    const cachedSummary = readSummaryFromCsv(quakeId);
    if (cachedSummary !== null) {
      console.log(`[summary] cache hit: earthquake_id=${quakeId}, path=${CACHE_FILE_PATH}`);
      return res.json({ summary: cachedSummary, cached: true });
    }
    console.log(`[summary] cache miss: earthquake_id=${quakeId}, path=${CACHE_FILE_PATH}`);

    const summary = await generateEarthquakeSummary({
      mag: Number(mag),
      place: place || 'Unknown location',
      depth: Number(depth),
      time: Number(time),
      lat: Number(lat),
      lng: Number(lng)
    });

    appendSummaryToCsv({
      earthquake_id: quakeId,
      mag: Number(mag),
      place: place || 'Unknown location',
      depth: Number(depth),
      time: Number(time),
      summary_text: summary,
      created_at: Date.now()
    });

    return res.json({ summary });
  } catch (error) {
    console.error('[summary] request failed:', {
      message: error?.message || String(error),
      stack: error?.stack
    });
    return res.status(500).json({
      error: 'Failed to generate summary',
      message: error?.message || 'unknown error'
    });
  }
});

module.exports = router;
module.exports.CACHE_FILE_PATH = CACHE_FILE_PATH;
