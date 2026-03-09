import { readJsonFromStorage, writeJsonToStorage } from './localStorage';

export type OfflineDomain =
  | 'orders'
  | 'inventory'
  | 'sessions'
  | 'settings'
  | 'products'
  | 'customers'
  | 'categories';

export type OfflineOperationStatus = 'pending' | 'syncing' | 'failed' | 'synced';

export interface OfflineOperation<TPayload = unknown> {
  operationId: string;
  domain: OfflineDomain;
  action: string;
  payload: TPayload;
  status: OfflineOperationStatus;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
  lastError?: string;
}

export interface ReplayConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface ReplayReport {
  attempted: number;
  synced: number;
  failed: number;
  skipped: number;
}

export interface OfflineQueueStore {
  list(): Promise<OfflineOperation[]>;
  upsert(operation: OfflineOperation): Promise<void>;
  remove(operationId: string): Promise<void>;
  clear(): Promise<void>;
}

export type OfflineExecutor = (operation: OfflineOperation) => Promise<void>;

const OFFLINE_QUEUE_STORAGE_KEY = 'molls_offline_queue';

export const DEFAULT_REPLAY_CONFIG: ReplayConfig = {
  maxRetries: 5,
  baseDelayMs: 500,
  maxDelayMs: 10_000,
};

function now(): number {
  return Date.now();
}

function sortByCreatedAt(operations: OfflineOperation[]): OfflineOperation[] {
  return [...operations].sort((a, b) => a.createdAt - b.createdAt);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function createOfflineOperation<TPayload>(
  input: Pick<OfflineOperation<TPayload>, 'domain' | 'action' | 'payload'>,
): OfflineOperation<TPayload> {
  const ts = now();
  return {
    operationId: crypto.randomUUID(),
    domain: input.domain,
    action: input.action,
    payload: input.payload,
    status: 'pending',
    retryCount: 0,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function computeBackoffDelay(
  retryCount: number,
  config: ReplayConfig = DEFAULT_REPLAY_CONFIG,
): number {
  const exponent = Math.max(0, retryCount - 1);
  const raw = config.baseDelayMs * 2 ** exponent;
  return Math.min(config.maxDelayMs, raw);
}

export class LocalStorageOfflineQueueStore implements OfflineQueueStore {
  async list(): Promise<OfflineOperation[]> {
    const data = readJsonFromStorage<OfflineOperation[]>(OFFLINE_QUEUE_STORAGE_KEY);
    if (!Array.isArray(data)) return [];
    return sortByCreatedAt(data);
  }

  async upsert(operation: OfflineOperation): Promise<void> {
    const current = await this.list();
    const next = current.filter((item) => item.operationId !== operation.operationId);
    next.push(operation);
    writeJsonToStorage(OFFLINE_QUEUE_STORAGE_KEY, sortByCreatedAt(next));
  }

  async remove(operationId: string): Promise<void> {
    const current = await this.list();
    const next = current.filter((item) => item.operationId !== operationId);
    writeJsonToStorage(OFFLINE_QUEUE_STORAGE_KEY, next);
  }

  async clear(): Promise<void> {
    writeJsonToStorage<OfflineOperation[]>(OFFLINE_QUEUE_STORAGE_KEY, []);
  }
}

export class InMemoryOfflineQueueStore implements OfflineQueueStore {
  private operations: OfflineOperation[] = [];

  async list(): Promise<OfflineOperation[]> {
    return sortByCreatedAt(this.operations);
  }

  async upsert(operation: OfflineOperation): Promise<void> {
    this.operations = this.operations.filter(
      (item) => item.operationId !== operation.operationId,
    );
    this.operations.push(operation);
    this.operations = sortByCreatedAt(this.operations);
  }

  async remove(operationId: string): Promise<void> {
    this.operations = this.operations.filter(
      (item) => item.operationId !== operationId,
    );
  }

  async clear(): Promise<void> {
    this.operations = [];
  }
}

export async function enqueueOfflineOperation(
  store: OfflineQueueStore,
  operation: OfflineOperation,
): Promise<void> {
  const next: OfflineOperation = {
    ...operation,
    status: 'pending',
    updatedAt: now(),
  };
  await store.upsert(next);
}

export async function replayOfflineQueue(
  store: OfflineQueueStore,
  execute: OfflineExecutor,
  config: ReplayConfig = DEFAULT_REPLAY_CONFIG,
): Promise<ReplayReport> {
  const report: ReplayReport = {
    attempted: 0,
    synced: 0,
    failed: 0,
    skipped: 0,
  };

  const operations = await store.list();
  for (const operation of operations) {
    if (
      operation.status !== 'pending' &&
      operation.status !== 'failed' &&
      operation.status !== 'syncing'
    ) {
      report.skipped += 1;
      continue;
    }

    if (operation.retryCount >= config.maxRetries) {
      report.skipped += 1;
      continue;
    }

    report.attempted += 1;

    await store.upsert({
      ...operation,
      status: 'syncing',
      updatedAt: now(),
    });

    try {
      await execute(operation);
      await store.remove(operation.operationId);
      report.synced += 1;
    } catch (error) {
      const nextRetryCount = operation.retryCount + 1;
      await store.upsert({
        ...operation,
        status: 'failed',
        retryCount: nextRetryCount,
        lastError: toErrorMessage(error),
        updatedAt: now(),
      });
      report.failed += 1;
    }
  }

  return report;
}
