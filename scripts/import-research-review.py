"""Import checked claim metadata into the existing research v1 SQLite store.

No schema migration, publication, media download or network access. Default: rollback.
"""
import argparse
import hashlib
import json
import sqlite3
import sys
from datetime import date, datetime, timezone
from contextlib import closing
from pathlib import Path
from urllib.parse import unquote, urlsplit

WEB_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REVIEW = WEB_ROOT / 'data/research/register-review-2026-10-28.json'


def required_text(value):
    return isinstance(value, str) and bool(value.strip())


def claims_for_record(record):
    return [record, *[{**record, **claim} for claim in record.get('additional_claims', [])]]


def validate(pack):
    if pack.get('publication_action') != 'none':
        raise ValueError('Research imports cannot publish')
    for key in ('version', 'reviewer', 'scope', 'input_workbook_sha256'):
        if not required_text(pack.get(key)):
            raise ValueError(f'Missing {key}')
    date.fromisoformat(pack['reviewed_at'])
    sources = {source['id']: source for source in pack['sources']}
    if len(sources) != len(pack['sources']):
        raise ValueError('Duplicate sources')
    for source in sources.values():
        parts = urlsplit(source['url'])
        if parts.scheme != 'https' or not parts.hostname or parts.username or parts.password:
            raise ValueError('Unsafe source URL')
        if not all(required_text(source.get(key)) for key in ('source_version', 'rights_basis', 'source_type')):
            raise ValueError('Incomplete source review')
        if source.get('new_source') and not all(required_text(source.get(key)) for key in ('name', 'publisher', 'consulted_extent', 'license_reported')):
            raise ValueError('New source requires complete registration metadata')
    content_ids, claim_ids = set(), set()
    if not pack['records']:
        raise ValueError('No register records')
    for row in pack['records']:
        if row['content_id'] in content_ids:
            raise ValueError('Duplicate content')
        content_ids.add(row['content_id'])
        if row['classification'] not in ('official_register', 'source_supported'):
            raise ValueError('Only source-checked classifications are accepted')
        for extra in row.get('additional_claims', []):
            if any(key in extra for key in ('content_id', 'classification', 'additional_claims')):
                raise ValueError('Additional claim cannot change content/classification or nest claims')
        for claim in claims_for_record(row):
            if claim['claim_id'] in claim_ids:
                raise ValueError('Duplicate claim')
            claim_ids.add(claim['claim_id'])
            source = sources[claim['source_id']]
            if claim['review_status'] != 'accepted':
                raise ValueError('Expected checked evidence')
            for key in ('claim_id', 'statement', 'locator', 'scope', 'historical_area'):
                if not required_text(claim.get(key)):
                    raise ValueError(f'Missing {key}')
            if row['classification'] == 'official_register':
                if claim['claim_kind'] != 'register_entry' or source['source_type'] != 'official_register':
                    raise ValueError('A catalog or article is not register evidence')
                for key in ('register_number', 'decision_number'):
                    if not required_text(claim.get(key)):
                        raise ValueError(f'Missing {key}')
                if date.fromisoformat(claim['decision_date']) > date.fromisoformat(pack['reviewed_at']):
                    raise ValueError('Future decision')
            else:
                if source['source_type'] in ('library_catalog', 'book_notice', 'bibliographic_index') or source.get('consulted_extent') not in ('full_article', 'transcription', 'abstract'):
                    raise ValueError('Bibliographic/index metadata are not content evidence')
                if claim['claim_kind'] not in ('fact', 'hypothesis', 'variant', 'historical_interpretation'):
                    raise ValueError('Unsupported source claim kind')
                if source.get('consulted_extent') == 'abstract' and not any(word in claim['locator'].lower() for word in ('tóm tắt', 'abstract')):
                    raise ValueError('Abstract cannot support a full-text page locator')
        if any(key in row for key in ('status', 'media', 'latitude', 'longitude')):
            raise ValueError('Publication, media and coordinates are outside this import')
        if row.get('dossier'):
            dossier = row['dossier']
            if dossier.get('publication_status') != 'draft' or dossier.get('media_status') != 'not_cleared' or dossier.get('audio_asset_id') is not None:
                raise ValueError('Draft dossiers cannot approve publication or media')
            if not required_text(dossier.get('introduction')) or not required_text(dossier.get('next_action')) or not dossier.get('sections'):
                raise ValueError('Incomplete draft dossier')
            ids = {claim['claim_id'] for claim in claims_for_record(row)}
            for section in dossier['sections']:
                if not all(required_text(section.get(key)) for key in ('heading', 'text', 'kind')) or not section.get('claim_ids') or not set(section['claim_ids']).issubset(ids):
                    raise ValueError('Draft section has no reviewed claim')
    observation_ids = [row['id'] for row in pack['observations']]
    if len(set(observation_ids)) != len(observation_ids):
        raise ValueError('Duplicate observations')
    for row in pack['observations']:
        if date.fromisoformat(row['observed_at']) > date.fromisoformat(pack['reviewed_at']):
            raise ValueError('Future observation')
        parts = urlsplit(row['url'])
        if parts.scheme != 'https' or not parts.hostname or parts.username or parts.password:
            raise ValueError('Unsafe observation URL')
        for key in ('id', 'source_id', 'locator', 'finding', 'method'):
            if not required_text(row.get(key)):
                raise ValueError(f'Missing observation {key}')
    for row in pack['leads']:
        if row['relation'] not in ('lead', 'context') or not all(required_text(row.get(key)) for key in ('content_id', 'source_id', 'note', 'next_action')):
            raise ValueError('A lead is not accepted evidence')


def counts(db):
    rows = db.execute('SELECT verified,eligible FROM publication_eligibility').fetchall()
    return {'editorial_items': len(rows), 'verified_claim_sets': sum(row['verified'] for row in rows),
            'pending_verification': sum(not row['verified'] for row in rows),
            'publication_eligible': sum(row['eligible'] for row in rows),
            'published': db.execute("SELECT count(*) FROM editorial_queue WHERE status='published'").fetchone()[0]}


def import_review(db_path, review_path=DEFAULT_REVIEW, apply=False, backup_dir=None):
    db_path, review_path = Path(db_path).resolve(strict=True), Path(review_path).resolve(strict=True)
    raw = review_path.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    pack = json.loads(raw)
    validate(pack)
    batch_id = f"review:{pack['version']}"
    db = sqlite3.connect(db_path.as_uri() + '?mode=rw', uri=True)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    backup_path = None
    try:
        if db.execute('PRAGMA user_version').fetchone()[0] != 1:
            raise ValueError('Expected existing research schema version 1')
        if not db.execute('SELECT 1 FROM import_batch WHERE sha256=? AND input_kind=?',
                          (pack['input_workbook_sha256'], 'user_supplied_xlsx')).fetchone():
            raise ValueError('Workbook provenance not found in this database')
        # SQLite backup includes WAL contents, unlike copying the .sqlite file.
        if apply:
            target = Path(backup_dir or WEB_ROOT / 'outputs/research-review/backups').resolve()
            target.mkdir(parents=True, exist_ok=True)
            backup_path = target / f"research-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')}.sqlite"
            with closing(sqlite3.connect(backup_path)) as backup:
                db.backup(backup)
        db.execute('BEGIN IMMEDIATE')
        previous = db.execute('SELECT sha256 FROM import_batch WHERE id=?', (batch_id,)).fetchone()
        if previous:
            if previous['sha256'] != sha:
                raise ValueError('Review version already exists with different contents; use a new version and review')
            db.rollback()
            return {'already_imported': True, 'applied': False, 'counts': counts(db)}
        before = {row['id']: row['status'] for row in db.execute('SELECT id,status FROM editorial_queue')}
        new_sources = []
        for source in pack['sources']:
            registered = db.execute('SELECT url,source_type FROM source_registry WHERE id=?', (source['id'],)).fetchone()
            if registered and (unquote(registered['url']) != unquote(source['url']) or registered['source_type'] != source['source_type']):
                raise ValueError(f"Source identity mismatch: {source['id']}")
            if not registered:
                if source.get('new_source') is not True:
                    raise ValueError(f"Unregistered source: {source['id']}")
                new_sources.append(source)
        for row in pack['records']:
            if before.get(row['content_id']) != 'draft':
                raise ValueError(f"Refusing to alter non-draft/missing content: {row['content_id']}")
            for claim in claims_for_record(row):
                if db.execute('SELECT 1 FROM content_claim WHERE id=?', (claim['claim_id'],)).fetchone():
                    raise ValueError(f"Claim exists outside this batch: {claim['claim_id']}")
            current = db.execute('SELECT classification FROM editorial_queue WHERE id=?', (row['content_id'],)).fetchone()
            if current['classification'] == 'official_register' and row['classification'] != 'official_register' and db.execute('SELECT 1 FROM content_claim WHERE content_id=?', (row['content_id'],)).fetchone():
                raise ValueError('Mixed register/content reviews require explicit editorial reconciliation')
        stamp = datetime.now(timezone.utc).isoformat(timespec='seconds')
        db.execute('INSERT INTO import_batch VALUES (?,?,?,?,?,?)',
                   (batch_id, str(review_path), sha, stamp, 'review_metadata',
                    json.dumps({'version': pack['version'], 'scope': pack['scope'], 'publication_action': 'none'}, ensure_ascii=False)))
        for source in new_sources:
            db.execute('''INSERT INTO source_registry
                (id,name,source_type,url,topics,format,license_reported,next_action,notes,batch_id,input_locator,raw_json)
                VALUES (?,?,?,?,?,'HTML',?,?,?,?,?,?)''',
                (source['id'], source['name'], source['source_type'], source['url'], 'research_review',
                 source['license_reported'], 'manual_editorial_and_rights_review',
                 f"{source['source_version']} | {source['rights_basis']}", batch_id,
                 f"{pack['version']}: sources[{source['id']}]", json.dumps(source, ensure_ascii=False)))
        for row in [claim for record in pack['records'] for claim in claims_for_record(record)]:
            content_id, source_id = row['content_id'], row['source_id']
            old_link = db.execute('SELECT relation FROM content_source WHERE content_id=? AND source_id=?', (content_id, source_id)).fetchone()
            if old_link and old_link['relation'] == 'contradicts':
                raise ValueError('Resolve contradictory source links explicitly before import')
            db.execute('''INSERT INTO content_source (content_id,source_id,relation,notes) VALUES (?,?,'supports',?)
                ON CONFLICT(content_id,source_id) DO UPDATE SET relation='supports',notes=excluded.notes''',
                (content_id, source_id, f"{pack['version']}: {row['scope']}"))
            db.execute('''INSERT INTO content_claim
                (id,content_id,statement,claim_kind,scope,required,review_status,reviewer,reviewed_at)
                VALUES (?,?,?,?,?,1,'accepted',?,?)''',
                (row['claim_id'], content_id, row['statement'], row['claim_kind'], row['scope'], pack['reviewer'], pack['reviewed_at']))
            source = next(source for source in pack['sources'] if source['id'] == source_id)
            db.execute('''INSERT INTO claim_evidence
                (id,claim_id,source_id,locator,checked_at,source_version,relation,status,reviewer,review_note)
                VALUES (?,?,?,?,?,?,'supports','accepted',?,?)''',
                (f"{row['claim_id']}:evidence", row['claim_id'], source_id, row['locator'], pack['reviewed_at'],
                 source['source_version'], pack['reviewer'], f"{row['scope']} {source['rights_basis']}"))
            db.execute('UPDATE editorial_queue SET classification=?,classification_reason=? WHERE id=?',
                       (row['classification'], f"{row['claim_id']}: {row['locator']} {row['scope']}", content_id))
        for row in pack['leads']:
            # Existing links retain their relation; a new research note cannot
            # promote an old lead to evidence or erase a contradictory relation.
            db.execute('''INSERT INTO content_source (content_id,source_id,relation,notes) VALUES (?,?,?,?)
                ON CONFLICT(content_id,source_id) DO UPDATE SET notes=excluded.notes''',
                (row['content_id'], row['source_id'], row['relation'], f"{row['note']} {row['next_action']}"))
        keys = ('id', 'source_id', 'observed_at', 'url', 'locator', 'finding', 'method')
        for row in pack['observations']:
            values = tuple(row[key] for key in keys)
            existing = db.execute('SELECT * FROM source_observation WHERE id=?', (row['id'],)).fetchone()
            if existing and tuple(existing[key] for key in keys) != values:
                raise ValueError('Observation ID already exists with different contents')
            db.execute('INSERT OR IGNORE INTO source_observation VALUES (?,?,?,?,?,?,?)', values)
        after = {row['id']: row['status'] for row in db.execute('SELECT id,status FROM editorial_queue')}
        if before != after or db.execute('PRAGMA foreign_key_check').fetchall():
            raise ValueError('Status or foreign-key integrity changed')
        all_claims = [claim for record in pack['records'] for claim in claims_for_record(record)]
        result = {'already_imported': False, 'applied': apply, 'checked_claims': len(all_claims),
                  'checked_register_claims': sum(claim['claim_kind'] == 'register_entry' for claim in all_claims),
                  'source_supported_claims': sum(claim['classification'] == 'source_supported' for claim in all_claims),
                  'new_sources': len(new_sources),
                  'backup': str(backup_path) if backup_path else None, 'counts': counts(db)}
        db.commit() if apply else db.rollback()
        if not apply:
            result['counts_scope'] = 'Proposed transaction; rolled back without changing the database'
        return result
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', required=True)
    parser.add_argument('--review', default=str(DEFAULT_REVIEW))
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--backup-dir')
    args = parser.parse_args()
    print(json.dumps(import_review(args.db, args.review, args.apply, args.backup_dir), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    main()
