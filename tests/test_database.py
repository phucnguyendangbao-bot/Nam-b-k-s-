import re
import sqlite3
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class DatabasePolicyTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(':memory:')
        self.db.execute('PRAGMA foreign_keys=ON')
        for p in sorted((ROOT/'drizzle').glob('*.sql')):self.db.executescript(p.read_text(encoding='utf-8'))
        self.db.execute("INSERT INTO source_registry VALUES ('s','Synthetic source','official_register','https://example.invalid','','HTML','test-only','','','fixture','test')")
        self.db.execute("INSERT INTO cultural_contents (id,slug,title,category,historical_area,community,classification,created_at,updated_at) VALUES ('c','fixture','Dữ liệu minh họa','di_san','fixture','fixture','official_register','2026-10-27','2026-10-27')")
    def tearDown(self):self.db.close()
    def ready(self):
        self.db.execute("UPDATE cultural_contents SET body='Dữ liệu minh họa kỹ thuật',storage_consent=1 WHERE id='c'")
        self.db.execute("INSERT INTO source_citations VALUES ('e','c','s','Synthetic statement','register_entry','Synthetic locator','Test revision','supports','accepted','Synthetic note','reviewer','2026-10-27')")
        self.db.execute("UPDATE cultural_contents SET approved_revision=revision,reviewed_by='reviewer',publish_rights=1,rights_basis='Synthetic original text permission',rights_reviewer='reviewer' WHERE id='c'")
    def test_guard_blocks_publication_from_label_alone(self):
        self.assertEqual(self.db.execute('SELECT eligible FROM publication_eligibility').fetchone()[0],0)
        with self.assertRaises(sqlite3.IntegrityError):self.db.execute("UPDATE cultural_contents SET status='published' WHERE id='c'")
    def test_storage_without_permission_is_rejected(self):
        with self.assertRaises(sqlite3.IntegrityError):self.db.execute("UPDATE cultural_contents SET body='test' WHERE id='c'")
    def test_valid_evidence_and_rights_permit_explicit_publication(self):
        self.ready();self.db.execute("UPDATE cultural_contents SET status='published' WHERE id='c'")
        self.assertEqual(self.db.execute('SELECT status,eligible FROM publication_eligibility').fetchone(),('published',1))
    def test_body_change_invalidates_approval(self):
        self.ready();self.db.execute("UPDATE cultural_contents SET status='published' WHERE id='c'")
        self.db.execute("UPDATE cultural_contents SET body='Dữ liệu minh họa đã sửa' WHERE id='c'")
        self.assertEqual(self.db.execute('SELECT status,eligible FROM publication_eligibility').fetchone(),('draft',0))
    def test_source_change_reopens_evidence_and_hides_article(self):
        self.ready();self.db.execute("UPDATE cultural_contents SET status='published' WHERE id='c'")
        self.db.execute("UPDATE source_registry SET url='https://example.invalid/new' WHERE id='s'")
        self.assertEqual(self.db.execute('SELECT status,eligible FROM publication_eligibility').fetchone(),('draft',0))
        self.assertEqual(self.db.execute('SELECT status FROM source_citations').fetchone()[0],'pending')
    def test_catalog_is_not_fulltext_evidence(self):
        self.db.execute("UPDATE source_registry SET source_type='library_catalog' WHERE id='s'")
        with self.assertRaises(sqlite3.IntegrityError):self.ready()
    def test_audit_and_revision_history_are_append_only(self):
        self.db.execute("INSERT INTO review_logs VALUES ('l','u','test','c','{}','2026-10-27')")
        self.db.execute("INSERT INTO content_revisions VALUES ('r','c',1,'{}','u','2026-10-27')")
        for table in ['review_logs','content_revisions']:
            with self.assertRaises(sqlite3.IntegrityError):self.db.execute('DELETE FROM '+table)
    def test_migration_policy_matches_runtime_filter(self):
        policy=re.search(r'export const eligibilitySQL=`(.*?)`;',(ROOT/'lib/policy.ts').read_text(encoding='utf-8'),re.S).group(1)
        view=self.db.execute("SELECT sql FROM sqlite_master WHERE name='publication_eligibility'").fetchone()[0]
        self.assertIn(policy,view)
    def test_pending_media_blocks_publication_even_when_body_is_reviewed(self):
        self.ready()
        self.db.execute("INSERT INTO media_assets (id,content_id,kind,url,caption,author,source_url,license_name,license_url,modifications,attribution) VALUES ('m','c','image','/media/test.webp','test','Synthetic author','https://commons.wikimedia.org/wiki/File:Test','CC BY 4.0','https://creativecommons.org/licenses/by/4.0/','test resize','test')")
        self.db.execute("UPDATE cultural_contents SET approved_revision=revision,reviewed_by='reviewer' WHERE id='c'")
        self.assertEqual(self.db.execute('SELECT eligible FROM publication_eligibility').fetchone()[0],0)
        with self.assertRaises(sqlite3.IntegrityError):self.db.execute("UPDATE cultural_contents SET status='published' WHERE id='c'")
    def test_dictionary_requires_its_own_review(self):
        self.ready();self.db.execute("UPDATE cultural_contents SET content_kind='dialect' WHERE id='c'")
        self.db.execute("INSERT INTO dialect_entries (content_id,headword,meaning,usage_context,example,example_note,regional_scope,part_of_speech) VALUES ('c','test','test meaning','test context','authored example','test note','test scope','test type')")
        self.db.execute("UPDATE cultural_contents SET approved_revision=revision,reviewed_by='reviewer' WHERE id='c'")
        self.assertEqual(self.db.execute('SELECT eligible FROM publication_eligibility').fetchone()[0],0)
        self.db.execute("UPDATE dialect_entries SET review_status='accepted',reviewer='reviewer' WHERE content_id='c'")
        self.db.execute("UPDATE cultural_contents SET approved_revision=revision,reviewed_by='reviewer' WHERE id='c'")
        self.assertEqual(self.db.execute('SELECT eligible FROM publication_eligibility').fetchone()[0],1)
    def test_structured_text_edits_invalidate_approval(self):
        self.ready();self.db.execute("UPDATE cultural_contents SET status='published' WHERE id='c'")
        self.db.execute("UPDATE cultural_contents SET scope_note='Changed scope' WHERE id='c'")
        self.assertEqual(self.db.execute('SELECT status,eligible FROM publication_eligibility').fetchone(),('draft',0))

if __name__=='__main__':unittest.main()
