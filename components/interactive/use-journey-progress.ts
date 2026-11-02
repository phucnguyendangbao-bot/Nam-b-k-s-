'use client';
import { useCallback, useSyncExternalStore } from 'react';
import { journeyProgressKey, validJourneyStop } from '@/lib/journey-progress';

const eventName = 'nbs:journey-progress';
const subscribe = (listener: () => void) => {
  window.addEventListener('storage', listener);
  window.addEventListener(eventName, listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener(eventName, listener); };
};
const serverSnapshot = () => null;

export function useJourneyProgress(slug: string, ids: readonly string[]) {
  const key = journeyProgressKey(slug);
  const snapshot = useCallback(() => { try { return localStorage.getItem(key); } catch { return null; } }, [key]);
  const saved = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const save = useCallback((id: string) => {
    try { localStorage.setItem(key, id); window.dispatchEvent(new Event(eventName)); } catch { /* Private browsing can disable storage. */ }
  }, [key]);
  return { saved: validJourneyStop(saved, ids), save };
}
