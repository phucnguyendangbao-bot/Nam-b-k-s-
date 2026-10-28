"""SQLite tests use disposable fixtures only, never the delivered database."""
import importlib.util
import json
import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT.parent / 'research/schema.sql'
spec = importlib.util.spec_from_file_location('review_import', ROOT / 'scripts/import-research-review.py')
review_import = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review_import)


@unittest.skipUnless(SCHEMA.exists(), 'Requires the existing research v1 schema beside web/')
class ResearchReviewTests(unittest.TestCase):
    def setUp(self):
        temporary_root = ROOT / 'outputs/research-review/tests'
        temporary_root.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=temporary_root)
        self.folder = Path(self.temp.name)
        self.db_path = self.folder / 'fixture.sqlite'
        self.review = json.loads(review_import.DEFAULT_REVIEW.read_text(encoding='utf-8'))
        self.review_path = self.folder / 'review.json'
        self.save_review()
        seed = json.loads((ROOT / 'lib/research-seed.json').read_text(encoding='utf-8'))
        with closing(sqlite3.connect(self.db_path)) as db, db:
            db.executescript(SCHEMA.read_text(encoding='utf-8'))
            db.execute('PRAGMA user_version=1')
            db.execute('INSERT INTO import_batch VALUES (?,?,?,?,?,?)',
                       ('fixture', 'SYNTHETIC test metadata', seed['sha256'], '2026-10-28', 'user_supplied_xlsx', '{}'))
            for source in seed['sources']:
                db.execute('''INSERT INTO source_registry
                    (id,name,source_type,url,topics,format,license_reported,next_action,notes,batch_id,input_locator,raw_json)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)''',
                    (source['id'], source['name'], source['source_type'], source['url'], '', '', 'unknown', 'test', '', 'fixture', 'fixture', '{}'))
            for item in seed['contents']:
                db.execute('''INSERT INTO editorial_queue
                    (id,category,title,historical_area,community,imported_verification,classification,classification_reason,batch_id,input_locator,raw_json)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)''',
                    (item['id'], item['category'], item['title'], item['historical_area'], item['community'],
                     'test', item['classification'], 'fixture', 'fixture', 'fixture', '{}'))

    def tearDown(self):
        self.temp.cleanup()

    def save_review(self):
        self.review_path.write_text(json.dumps(self.review, ensure_ascii=False), encoding='utf-8')

    def run_import(self, apply=False):
        return review_import.import_review(self.db_path, self.review_path, apply, self.folder / 'backups')

    def query(self, sql):
        with closing(sqlite3.connect(self.db_path)) as db:
            return db.execute(sql).fetchall()

    def test_dry_run_rolls_back_every_change(self):
        result = self.run_import()
        self.assertEqual(result['counts']['verified_claim_sets'], 8)
        self.assertEqual(self.query('SELECT count(*) FROM content_claim'), [(0,)])
        self.assertEqual(self.query('SELECT count(*) FROM source_observation'), [(0,)])
        self.assertEqual(self.query('SELECT count(*) FROM import_batch'), [(1,)])

    def test_apply_is_backed_up_idempotent_and_never_publishes(self):
        result = self.run_import(True)
        self.assertTrue(Path(result['backup']).exists())
        self.assertEqual(result['counts'], {'editorial_items': 40, 'verified_claim_sets': 8,
            'pending_verification': 32, 'publication_eligible': 0, 'published': 0})
        self.assertEqual(self.query("SELECT count(*) FROM editorial_queue WHERE status='draft'"), [(40,)])
        self.assertEqual(self.query('SELECT count(*) FROM rights_clearance'), [(0,)])
        self.assertEqual(self.query('SELECT count(*) FROM content_asset'), [(0,)])
        self.assertEqual(self.query("SELECT count(*) FROM editorial_queue WHERE raw_json='{}'"), [(40,)])
        self.assertTrue(self.run_import(True)['already_imported'])
        self.assertEqual(self.query('SELECT count(*) FROM content_claim'), [(8,)])
        self.assertEqual(self.query('SELECT count(*) FROM source_observation'), [(7,)])

    def test_changed_batch_version_cannot_overwrite_an_audit_record(self):
        self.run_import(True)
        self.review['records'][0]['statement'] += ' changed'
        self.save_review()
        with self.assertRaisesRegex(ValueError, 'different contents'):
            self.run_import(True)
        self.assertEqual(self.query('SELECT count(*) FROM content_claim'), [(8,)])

    def test_late_foreign_key_failure_rolls_back_the_entire_batch(self):
        self.review['leads'][-1]['content_id'] = 'DOES-NOT-EXIST'
        self.save_review()
        with self.assertRaises(sqlite3.IntegrityError):
            self.run_import(True)
        self.assertEqual(self.query('SELECT count(*) FROM content_claim'), [(0,)])
        self.assertEqual(self.query('SELECT count(*) FROM import_batch'), [(1,)])

    def test_non_draft_editorial_work_and_unregistered_source_are_protected(self):
        with closing(sqlite3.connect(self.db_path)) as db, db:
            db.execute("UPDATE editorial_queue SET status='in_review' WHERE id='E015'")
        with self.assertRaisesRegex(ValueError, 'non-draft'):
            self.run_import(True)
        self.assertEqual(self.query('SELECT count(*) FROM content_claim'), [(0,)])
        with closing(sqlite3.connect(self.db_path)) as db, db:
            db.execute("UPDATE editorial_queue SET status='draft' WHERE id='E015'")
        self.review['sources'][0]['url'] = 'https://example.invalid/not-the-register'
        self.save_review()
        with self.assertRaisesRegex(ValueError, 'identity mismatch'):
            self.run_import(True)

    def test_catalog_and_publication_flags_are_rejected(self):
        self.review['records'][0]['source_id'] = 'S06'
        self.save_review()
        with self.assertRaisesRegex(ValueError, 'not register evidence'):
            self.run_import(True)
        self.review['records'][0]['source_id'] = 'S04'
        self.review['records'][0]['status'] = 'published'
        self.save_review()
        with self.assertRaisesRegex(ValueError, 'outside this import'):
            self.run_import(True)


if __name__ == '__main__':
    unittest.main()
