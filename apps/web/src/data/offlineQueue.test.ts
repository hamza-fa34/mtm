import { describe, expect, it } from 'vitest';
import {
  InMemoryOfflineQueueStore,
  computeBackoffDelay,
  createOfflineOperation,
  enqueueOfflineOperation,
  replayOfflineQueue,
} from './offlineQueue';

describe('offlineQueue foundations', () => {
  it('creates operation with id and pending status', () => {
    const operation = createOfflineOperation({
      domain: 'orders',
      action: 'create_order',
      payload: { total: 10 },
    });

    expect(operation.operationId).toBeTypeOf('string');
    expect(operation.operationId.length).toBeGreaterThan(10);
    expect(operation.status).toBe('pending');
    expect(operation.retryCount).toBe(0);
    expect(operation.createdAt).toBeTypeOf('number');
  });

  it('enqueues and replays successfully (operation removed)', async () => {
    const store = new InMemoryOfflineQueueStore();
    const operation = createOfflineOperation({
      domain: 'orders',
      action: 'create_order',
      payload: { orderNumber: '1001' },
    });

    await enqueueOfflineOperation(store, operation);
    const before = await store.list();
    expect(before).toHaveLength(1);

    const report = await replayOfflineQueue(store, async () => {
      return Promise.resolve();
    });

    const after = await store.list();
    expect(after).toHaveLength(0);
    expect(report.attempted).toBe(1);
    expect(report.synced).toBe(1);
    expect(report.failed).toBe(0);
  });

  it('marks operation failed and increments retry count when replay fails', async () => {
    const store = new InMemoryOfflineQueueStore();
    const operation = createOfflineOperation({
      domain: 'inventory',
      action: 'record_purchase',
      payload: { ingredientId: 'ing-1' },
    });

    await enqueueOfflineOperation(store, operation);
    const report = await replayOfflineQueue(store, async () => {
      throw new Error('network down');
    });

    const remaining = await store.list();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].status).toBe('failed');
    expect(remaining[0].retryCount).toBe(1);
    expect(remaining[0].lastError).toContain('network down');
    expect(report.attempted).toBe(1);
    expect(report.synced).toBe(0);
    expect(report.failed).toBe(1);
  });

  it('computes capped exponential backoff', () => {
    expect(computeBackoffDelay(1)).toBe(500);
    expect(computeBackoffDelay(2)).toBe(1000);
    expect(computeBackoffDelay(3)).toBe(2000);
    expect(computeBackoffDelay(10)).toBe(10000);
  });
});
