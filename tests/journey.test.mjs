import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { mapTours, mapToursFor } from '../lib/map-tours.ts';
import { imagePathAllowed, permitsCommercialMedia } from '../lib/editorial-model.ts';
import { journeyProgressKey, validJourneyStop } from '../lib/journey-progress.ts';

test('journey photographs are local, attributed, licensed and match their reviewed bytes', async () => {
  const manifest = JSON.parse(await readFile(new URL('../data/media/journey-photos.json', import.meta.url), 'utf8'));
  assert.equal(new Set(manifest.photos.map(photo => photo.stop_id)).size, manifest.photos.length);
  for (const photo of manifest.photos) {
    assert.ok(imagePathAllowed(photo.src));
    assert.ok(photo.author && photo.modifications && photo.width >= 1600 && photo.height > 0);
    assert.ok(photo.source_url.startsWith('https://commons.wikimedia.org/wiki/File:'));
    assert.ok(permitsCommercialMedia(photo.license, photo.license_url));
    const bytes = await readFile(new URL('../public' + photo.src, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), photo.sha256);
    const stop = mapTours.flatMap(tour => tour.stops).find(stop => stop.id === photo.stop_id);
    assert.equal(stop.image.src, photo.src);
    assert.ok(stop.image.credit.includes(photo.license));
  }
  assert.ok(mapTours.every(tour => tour.cover.src.startsWith('/media/') && tour.stops.every(stop => stop.image?.src.startsWith('/media/'))));
  assert.match(mapTours.flatMap(tour => tour.stops).find(stop => stop.id === 'dinh-binh-thuy').image.credit, /CC BY 3\.0/);
});

test('resume data cannot select a removed stop or a stop belonging to another journey', () => {
  const ids = mapTours[0].stops.map(stop => stop.id);
  assert.equal(validJourneyStop(ids[1], ids), ids[1]);
  assert.equal(validJourneyStop(null, ids), null);
  assert.equal(validJourneyStop('removed-stop', ids), null);
  assert.equal(validJourneyStop(mapTours[1].stops[0].id, ids), null);
  assert.notEqual(journeyProgressKey(mapTours[0].slug), journeyProgressKey(mapTours[1].slug));
});

test('dossier-to-map links keep the correct stop number and published route', () => {
  for (const tour of mapTours) for (const [index, stop] of tour.stops.entries()) {
    if (!stop.dossier) continue;
    const links = mapToursFor(stop.dossier.id);
    assert.ok(links.some(link => link.tour.slug === tour.slug && link.index === index && link.stop.id === stop.id));
  }
});
