const {
  CACHE_FILE_PATH,
  DEFAULT_MIN_MAGNITUDE,
  DEFAULT_START_DATE,
  prefetchAll,
  getFetchErrorMessage
} = require('../services/earthquakeCache');

function parseArgs() {
  const args = process.argv.slice(2);
  const kv = {};
  for (const arg of args) {
    const [k, v] = arg.split('=');
    if (k && v !== undefined) {
      kv[k.replace(/^--/, '')] = v;
    }
  }
  return kv;
}

async function main() {
  const args = parseArgs();
  const startDate = args.start || DEFAULT_START_DATE;
  const endDate = args.end || new Date().toISOString().slice(0, 10);
  const minMagnitude = Number.isFinite(Number(args.minMag))
    ? Number(args.minMag)
    : DEFAULT_MIN_MAGNITUDE;

  console.log(
    `[prefetch] start: range=${startDate}..${endDate}, minMag=${minMagnitude}, target=${CACHE_FILE_PATH}`
  );

  const payload = await prefetchAll({
    startDate,
    endDate,
    minMagnitude
  });

  console.log(
    `[prefetch] completed: features=${payload.features.length}, generatedAt=${payload.metadata?.generatedAt}`
  );
}

main().catch((error) => {
  console.error('[prefetch] failed:', getFetchErrorMessage(error));
  process.exitCode = 1;
});
