'use client';

import { useEffect, useState } from 'react';

export type JourneyPhoto = { src: string; alt: string; credit: string; href?: string; context?: boolean };

/** Decode the next photograph first, then dissolve; keep the current image if a request fails. */
export function JourneyScene({ photo, next }: { photo: JourneyPhoto; next?: JourneyPhoto }) {
  const [layers, setLayers] = useState([photo]);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let settle: ReturnType<typeof setTimeout>;
    const image = new window.Image();
    image.src = photo.src;
    const reveal = () => {
      if (cancelled) return;
      setLoadFailed(false);
      setLayers(previous => previous.at(-1)?.src === photo.src ? [photo] : [previous.at(-1)!, photo]);
      settle = setTimeout(() => { if (!cancelled) setLayers([photo]); }, 900);
    };
    image.decode().then(reveal).catch(() => { if (!cancelled) setLoadFailed(true); });
    return () => { cancelled = true; clearTimeout(settle); };
  }, [photo]);
  useEffect(() => {
    if (!next || next.src === photo.src) return;
    const image = new window.Image();
    image.src = next.src;
  }, [next, photo.src]);
  const displayed = layers.at(-1)!;
  return <div className="journey-scene">
    {layers.map((layer, index) => <div className={`journey-scene-layer ${index === layers.length - 1 ? 'is-current' : 'is-previous'}`} key={layer.src}>
      {/* The persistent layers preserve a photograph while the next asset decodes. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={layer.src} alt={index === layers.length - 1 ? layer.alt : ''} fetchPriority="high" decoding="async" />
    </div>)}
    <div className="journey-scene-shade" />
    {loadFailed && <p className="journey-image-notice" role="status">Chưa tải được ảnh chặng này; đang giữ khung hình trước.</p>}
    <p className="journey-credit">{displayed.context && <span>Ảnh bối cảnh · </span>}{displayed.href ? <a href={displayed.href} target="_blank" rel="noreferrer">{displayed.credit} ↗</a> : displayed.credit}</p>
  </div>;
}
