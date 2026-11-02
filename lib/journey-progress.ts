export const journeyProgressKey = (slug: string) => `nbs:journey:${slug}`;

export function validJourneyStop(value: string | null, ids: readonly string[]): string | null {
  return value && ids.includes(value) ? value : null;
}
