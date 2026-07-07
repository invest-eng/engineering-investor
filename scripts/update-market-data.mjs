#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchMarketData } from './lib/market-data.mjs';
import { fetchIndexPerformance } from './lib/index-performance.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');

async function main() {
  await mkdir(DATA_DIR, { recursive: true });

  const [trgi, perf] = await Promise.allSettled([
    fetchMarketData(),
    fetchIndexPerformance(),
  ]);

  if (trgi.status === 'fulfilled' && trgi.value) {
    await writeFile(join(DATA_DIR, 'market-data.json'), JSON.stringify(trgi.value, null, 2), 'utf8');
    console.log('[market-data] updated');
  } else {
    console.warn('[market-data] failed:', trgi.reason?.message);
  }

  if (perf.status === 'fulfilled' && perf.value) {
    await writeFile(join(DATA_DIR, 'index-performance.json'), JSON.stringify(perf.value, null, 2), 'utf8');
    console.log('[index-performance] updated');
  } else {
    console.warn('[index-performance] failed:', perf.reason?.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('update-market-data failed:', err.message);
    process.exit(1);
  });
