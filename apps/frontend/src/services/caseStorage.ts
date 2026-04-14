import type { AssignedCase } from './casesApi';

const KEY = 'emr_case_last_interacted';

/** Read the last-interacted timestamp map from localStorage. */
export function getLastInteracted(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

/** Update the last-interacted timestamp for a case. */
export function touchCase(caseId: number): void {
  const map = getLastInteracted();
  map[String(caseId)] = Date.now();
  localStorage.setItem(KEY, JSON.stringify(map));
}

/** Sort cases by most-recently-interacted (reads fresh from localStorage each call). */
export function sortByLastInteracted(cases: AssignedCase[]): AssignedCase[] {
  const map = getLastInteracted();
  return [...cases].sort((a, b) => (map[String(b.id)] ?? 0) - (map[String(a.id)] ?? 0));
}
