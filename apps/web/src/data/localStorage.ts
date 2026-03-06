export function readJsonFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJsonToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}
