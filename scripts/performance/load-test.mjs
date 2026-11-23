
import { performance } from 'node:perf_hooks';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const ENDPOINT = '/restaurants';

const TOTAL_REQUESTS = 100;
const CONCURRENCY = 10;
const TIMEOUT_MS = 10000;

const durations = [];
const statusCounts = new Map();

let nextRequest = 0;
let completed = 0;
let failed = 0;

async function sendRequest() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = performance.now();

  try {
    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: 'GET',
      signal: controller.signal,
    });

    const duration = performance.now() - startedAt;
    durations.push(duration);

    const status = response.status;
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);

    await response.arrayBuffer();

    if (!response.ok) {
      failed++;
    }
  } catch (error) {
    failed++;
    console.error(`Request failed: ${error.message}`);
  } finally {
    clearTimeout(timeout);
    completed++;
  }
}

async function worker() {
  while (nextRequest < TOTAL_REQUESTS) {
    nextRequest++;
    await sendRequest();
  }
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return 0;

  const index = Math.ceil(
    (percentileValue / 100) * sortedValues.length,
  ) - 1;

  return sortedValues[Math.max(0, index)];
}

async function main() {
  console.log('Restaurant Ordering System - Performance Test');
  console.log(`Endpoint: GET ${BASE_URL}${ENDPOINT}`);
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`Concurrency: ${CONCURRENCY}`);

  const startedAt = performance.now();

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker()),
  );

  const elapsedSeconds = (performance.now() - startedAt) / 1000;
  const sorted = [...durations].sort((a, b) => a - b);

  const average =
    sorted.length > 0
      ? sorted.reduce((sum, value) => sum + value, 0) / sorted.length
      : 0;

  console.log('\n--- Performance Results ---');
  console.log(`Completed Requests: ${completed}`);
  console.log(`Successful Requests: ${completed - failed}`);
  console.log(`Failed Requests: ${failed}`);
  console.log(`Total Time: ${elapsedSeconds.toFixed(2)} seconds`);
  console.log(
    `Throughput: ${(completed / elapsedSeconds).toFixed(2)} requests/sec`,
  );
  console.log(`Average Latency: ${average.toFixed(2)} ms`);
  console.log(`P50 Latency: ${percentile(sorted, 50).toFixed(2)} ms`);
  console.log(`P95 Latency: ${percentile(sorted, 95).toFixed(2)} ms`);
  console.log(`P99 Latency: ${percentile(sorted, 99).toFixed(2)} ms`);

  console.log('\nHTTP Status Counts:');
  for (const [status, count] of statusCounts) {
    console.log(`HTTP ${status}: ${count}`);
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Performance test failed:', error);
  process.exitCode = 1;
});
