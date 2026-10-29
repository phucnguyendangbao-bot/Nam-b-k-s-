'use client';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/** The entire story stays readable before hydration and with reduced motion. */
export function ScrollStory({ children, stage }: { children: ReactNode; stage: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node || !('IntersectionObserver' in window)) return;
    node.classList.add('is-enhanced');
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) node.dataset.step = (visible.target as HTMLElement).dataset.step;
    }, { rootMargin: '-20% 0px -35% 0px', threshold: [0, .25, .5] });
    node.querySelectorAll('.story-step').forEach(step => observer.observe(step));
    return () => { observer.disconnect(); node.classList.remove('is-enhanced'); };
  }, []);
  return <div className="scroll-story" ref={root} data-step="0"><div className="story-stage" aria-hidden="true">{stage}</div><div className="story-steps">{children}</div></div>;
}
