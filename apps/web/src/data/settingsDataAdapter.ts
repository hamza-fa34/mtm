import { getApiBaseUrl, getDataSourceMode } from './config';
import { readJsonFromStorage, writeJsonToStorage } from './localStorage';
import { setDomainDataSourceStatus } from './sourceStatus';

export interface TruckSettings {
  name: string;
  slogan: string;
  tvaEmporter: number;
  tvaPlace: number;
}

const SETTINGS_STORAGE_KEY = 'molls_settings';

export const DEFAULT_TRUCK_SETTINGS: TruckSettings = {
  name: "Molly's Truck",
  slogan: 'Les meilleurs burgers de la ville !',
  tvaEmporter: 5.5,
  tvaPlace: 10,
};

function safeVat(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Number(value.toFixed(2));
}

function sanitizeTruckSettings(input: Partial<TruckSettings>): TruckSettings {
  return {
    name:
      typeof input.name === 'string' && input.name.trim().length > 0
        ? input.name.trim()
        : DEFAULT_TRUCK_SETTINGS.name,
    slogan:
      typeof input.slogan === 'string'
        ? input.slogan.trim()
        : DEFAULT_TRUCK_SETTINGS.slogan,
    tvaEmporter: safeVat(input.tvaEmporter, DEFAULT_TRUCK_SETTINGS.tvaEmporter),
    tvaPlace: safeVat(input.tvaPlace, DEFAULT_TRUCK_SETTINGS.tvaPlace),
  };
}

async function fetchTruckSettingsFromApi(): Promise<TruckSettings> {
  const response = await fetch(`${getApiBaseUrl()}/settings`);
  if (!response.ok) {
    throw new Error(`Failed to fetch settings from API (${response.status})`);
  }
  const data = (await response.json()) as Partial<TruckSettings>;
  return sanitizeTruckSettings(data);
}

export function getLocalTruckSettings(): TruckSettings {
  const local = readJsonFromStorage<TruckSettings>(SETTINGS_STORAGE_KEY);
  return local ? sanitizeTruckSettings(local) : DEFAULT_TRUCK_SETTINGS;
}

export async function loadTruckSettings(): Promise<TruckSettings> {
  if (getDataSourceMode() === 'api') {
    try {
      const apiSettings = await fetchTruckSettingsFromApi();
      writeJsonToStorage(SETTINGS_STORAGE_KEY, apiSettings);
      setDomainDataSourceStatus('settings', 'api');
      return apiSettings;
    } catch {
      setDomainDataSourceStatus('settings', 'fallback');
      return getLocalTruckSettings();
    }
  }

  setDomainDataSourceStatus('settings', 'local');
  return getLocalTruckSettings();
}

export async function saveTruckSettings(settings: TruckSettings): Promise<void> {
  const sanitized = sanitizeTruckSettings(settings);
  writeJsonToStorage(SETTINGS_STORAGE_KEY, sanitized);
  setDomainDataSourceStatus(
    'settings',
    getDataSourceMode() === 'api' ? 'fallback' : 'local',
  );
}
