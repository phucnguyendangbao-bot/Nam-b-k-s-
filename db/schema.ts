import { integer, real, sqliteTable, text, primaryKey, index } from 'drizzle-orm/sqlite-core';

export const sourceRegistry = sqliteTable('source_registry', {
  id: text('id').primaryKey(), name: text('name').notNull(), type: text('source_type').notNull(),
  url: text('url').notNull(), topics: text('topics').notNull(), format: text('format').notNull(),
  license: text('license_reported').notNull(), action: text('next_action').notNull(), notes: text('notes').notNull(),
  inputLocator: text('input_locator').notNull(), batchHash: text('batch_hash').notNull(),
});
export const contents = sqliteTable('cultural_contents', {
  id: text('id').primaryKey(), slug: text('slug').notNull().unique(), title: text('title').notNull(),
  category: text('category').notNull(), historicalArea: text('historical_area').notNull(), community: text('community').notNull(),
  classification: text('classification').notNull(), importedVerification: text('imported_verification').notNull().default(''),
  summary: text('summary').notNull().default(''), body: text('body').notNull().default(''),
  contentKind: text('content_kind').notNull().default('general'),
  introduction: text('introduction').notNull().default(''), topic: text('topic').notNull().default(''),
  scopeNote: text('scope_note').notNull().default(''), sectionsJson: text('sections_json').notNull().default('[]'),
  textLicense: text('text_license').notNull().default(''), textLicenseUrl: text('text_license_url').notNull().default(''),
  status: text('status').notNull().default('draft'), revision: integer('revision').notNull().default(1),
  approvedRevision: integer('approved_revision').notNull().default(0), reviewedBy: text('reviewed_by'), reviewedAt: text('reviewed_at'),
  storageConsent: integer('storage_consent').notNull().default(0), publishRights: integer('publish_rights').notNull().default(0),
  rightsBasis: text('rights_basis').notNull().default(''), rightsReviewer: text('rights_reviewer'),
  latitude: real('latitude'), longitude: real('longitude'), geoReviewed: integer('geo_reviewed').notNull().default(0),
  geoBasis: text('geo_basis').notNull().default(''), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, table => [index('contents_status_category').on(table.status, table.category)]);
export const citations = sqliteTable('source_citations', {
  id: text('id').primaryKey(), contentId: text('content_id').notNull().references(() => contents.id),
  sourceId: text('source_id').notNull().references(() => sourceRegistry.id), statement: text('statement').notNull().default(''),
  claimKind: text('claim_kind').notNull().default('fact'), locator: text('locator').notNull().default(''),
  sourceVersion: text('source_version').notNull().default(''), relation: text('relation').notNull().default('lead'),
  status: text('status').notNull().default('pending'), note: text('review_note').notNull().default(''),
  reviewer: text('reviewer'), reviewedAt: text('reviewed_at'),
}, table => [index('citation_content').on(table.contentId)]);
export const roles = sqliteTable('user_roles', {
  userId: text('user_id').primaryKey(), role: text('role').notNull(), name: text('name').notNull(), createdAt: text('created_at').notNull(),
});
export const settings = sqliteTable('app_settings', { key: text('key').primaryKey(), value: text('value').notNull() });
export const logs = sqliteTable('review_logs', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), action: text('action').notNull(), targetId: text('target_id').notNull(),
  details: text('details').notNull(), createdAt: text('created_at').notNull(),
});
export const revisions = sqliteTable('content_revisions', {
  id: text('id').primaryKey(), contentId: text('content_id').notNull().references(() => contents.id), revision: integer('revision').notNull(),
  snapshot: text('snapshot_json').notNull(), userId: text('user_id').notNull(), createdAt: text('created_at').notNull(),
});
export const relationships = sqliteTable('entity_relationships', {
  id: text('id').primaryKey(), fromId: text('from_id').notNull().references(() => contents.id), toId: text('to_id').notNull().references(() => contents.id),
  kind: text('kind').notNull(), sourceId: text('source_id').notNull().references(() => sourceRegistry.id),
  locator: text('locator').notNull(), status: text('status').notNull().default('pending'), note: text('note').notNull(), reviewer: text('reviewer'),
});
export const tours = sqliteTable('tours', {
  id: text('id').primaryKey(), slug: text('slug').notNull().unique(), title: text('title').notNull(),
  kind: text('kind').notNull(), description: text('description').notNull().default(''), status: text('status').notNull().default('draft'),
  reviewedBy: text('reviewed_by'), createdAt: text('created_at').notNull(),
});
export const stops = sqliteTable('tour_stops', {
  id: text('id').primaryKey(), tourId: text('tour_id').notNull().references(() => tours.id),
  contentId: text('content_id').notNull().references(() => contents.id), position: integer('position').notNull(),
});
export const bookmarks = sqliteTable('user_bookmarks', {
  userId: text('user_id').notNull(), kind: text('kind').notNull(), targetId: text('target_id').notNull(), createdAt: text('created_at').notNull(),
}, table => [primaryKey({ columns: [table.userId, table.kind, table.targetId] })]);
export const progress = sqliteTable('tour_progress', {
  userId: text('user_id').notNull(), tourId: text('tour_id').notNull().references(() => tours.id),
  stopId: text('stop_id').notNull().references(() => stops.id), updatedAt: text('updated_at').notNull(),
}, table => [primaryKey({ columns: [table.userId, table.tourId] })]);
export const submissions = sqliteTable('community_submissions', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), contributorName: text('contributor_name').notNull(),
  title: text('title').notNull(), kind: text('kind').notNull(), body: text('body').notNull(), provenance: text('provenance').notNull(),
  storageConsent: integer('storage_consent').notNull(), publicationConsent: integer('publication_consent').notNull(),
  status: text('status').notNull().default('pending'), reviewer: text('reviewer'), reviewNote: text('review_note').notNull().default(''),
  createdAt: text('created_at').notNull(),
});
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(), count: integer('count').notNull(), expiresAt: integer('expires_at').notNull(),
});
export const mediaAssets = sqliteTable('media_assets', {
  id:text('id').primaryKey(),contentId:text('content_id').notNull().references(()=>contents.id),
  kind:text('kind').notNull(),url:text('url').notNull(),caption:text('caption').notNull(),
  author:text('author').notNull(),sourceUrl:text('source_url').notNull(),licenseName:text('license_name').notNull(),
  licenseUrl:text('license_url').notNull(),modifications:text('modifications').notNull(),
  attribution:text('attribution').notNull(),commercialAllowed:integer('commercial_allowed').notNull().default(0),
  reviewStatus:text('review_status').notNull().default('pending'),reviewer:text('reviewer'),reviewedAt:text('reviewed_at'),
  fileSha256:text('file_sha256').notNull().default(''),width:integer('width'),height:integer('height'),
},table=>[index('media_content').on(table.contentId)]);
export const dialectEntries = sqliteTable('dialect_entries', {
  contentId:text('content_id').primaryKey().references(()=>contents.id),headword:text('headword').notNull(),
  meaning:text('meaning').notNull(),usageContext:text('usage_context').notNull(),example:text('example').notNull(),
  exampleNote:text('example_note').notNull(),regionalScope:text('regional_scope').notNull(),
  partOfSpeech:text('part_of_speech').notNull(),audioAssetId:text('audio_asset_id').references(()=>mediaAssets.id),
  reviewStatus:text('review_status').notNull().default('pending'),reviewer:text('reviewer'),reviewedAt:text('reviewed_at'),
});
