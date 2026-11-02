import { storyImages, storyPosition } from './story';
import type { JourneyPhoto } from '@/components/interactive/journey-scene';
import type { Row } from './static-data';

/** A dossier photo is documentary; chapter imagery is explicitly labelled as context. */
export function journeyPhoto(row: Row): JourneyPhoto {
  if (row.image_url) return { src: String(row.image_url), alt: String(row.title), credit: `${row.image_author} · ${row.image_license}`, href: row.image_source_url || undefined };
  const chapter = storyPosition(String(row.id))?.chapter;
  const image = chapter?.image ?? storyImages.prologue;
  return { src: image.url, alt: image.alt, credit: `${image.caption} ${image.author} · ${image.license_name}`, href: image.source_url, context: true };
}

