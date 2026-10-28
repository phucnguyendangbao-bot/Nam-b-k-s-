import sqlite3
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class KnowledgeDatabaseTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(':memory:')
        self.db.execute('PRAGMA foreign_keys=ON')
        for p in sorted((ROOT/'drizzle').glob('*.sql')): self.db.executescript(p.read_text(encoding='utf-8'))
        self.db.execute("INSERT INTO source_registry VALUES ('s','Synthetic source','official_register','https://example.invalid','','HTML','test','','','fixture','test')")
        self.db.execute("INSERT INTO cultural_contents (id,slug,title,category,historical_area,community,classification,created_at,updated_at) VALUES ('c','fixture','Test only','di_san','fixture','fixture','official_register','2026-10-28','2026-10-28')")
        self.db.execute("UPDATE cultural_contents SET body='Synthetic test text',storage_consent=1 WHERE id='c'")
        self.db.execute("INSERT INTO source_citations VALUES ('e','c','s','Synthetic statement','register_entry','Synthetic locator','Test revision','supports','accepted','Test note','reviewer','2026-10-28')")
        self.db.execute("UPDATE cultural_contents SET approved_revision=revision,reviewed_by='reviewer',publish_rights=1,rights_basis='Test permission',rights_reviewer='reviewer' WHERE id='c'")
        self.db.execute("UPDATE cultural_contents SET status='published' WHERE id='c'")
        self.db.executescript((ROOT/'docs/database/knowledge-extension.sql').read_text(encoding='utf-8'))
    def tearDown(self): self.db.close()
    def alias(self): self.db.execute("INSERT INTO knowledge_alias VALUES ('a','c','Tên cũ','ten cu','historical_name','e','fixture')")
    def accept(self,kind,identity): self.db.execute("INSERT INTO knowledge_review VALUES (?,?,'accepted','reviewer','2026-10-28','fixture')",(kind,identity))
    def test_schema_extension_does_not_publish_or_edit_existing_content(self):
        self.assertEqual(self.db.execute('SELECT status,eligible FROM publication_eligibility').fetchone(),('published',1))
        self.assertEqual(self.db.execute('SELECT count(*) FROM knowledge_review').fetchone()[0],0)
    def test_alias_needs_separate_review_and_current_evidence(self):
        self.alias();self.assertEqual(self.db.execute('SELECT count(*) FROM knowledge_public_alias').fetchone()[0],0)
        self.accept('alias','a');self.assertEqual(self.db.execute('SELECT count(*) FROM knowledge_public_alias').fetchone()[0],1)
        self.db.execute("UPDATE source_citations SET status='pending' WHERE id='e'")
        self.assertEqual(self.db.execute('SELECT count(*) FROM knowledge_public_alias').fetchone()[0],0)
    def test_review_cannot_be_accepted_without_reviewer(self):
        with self.assertRaises(sqlite3.IntegrityError):self.db.execute("INSERT INTO knowledge_review(object_type,object_id,status,reviewed_at) VALUES ('alias','a','accepted','2026-10-28')")
    def test_metadata_edits_require_a_new_review(self):
        self.alias();self.accept('alias','a')
        self.db.execute("UPDATE knowledge_alias SET value='Changed' WHERE id='a'")
        self.assertEqual(self.db.execute('SELECT status FROM knowledge_review').fetchone()[0],'pending')
        self.assertEqual(self.db.execute('SELECT count(*) FROM knowledge_public_alias').fetchone()[0],0)
    def test_evidence_edits_reopen_metadata_even_if_evidence_status_stays_accepted(self):
        self.alias();self.accept('alias','a')
        self.db.execute("UPDATE source_citations SET locator='Different locator' WHERE id='e'")
        self.assertEqual(self.db.execute('SELECT status FROM knowledge_review').fetchone()[0],'pending')
    def test_historical_names_are_append_only_and_current_units_need_check_date(self):
        self.db.execute("INSERT INTO knowledge_place_assignment VALUES ('p','c','Old name','area_as_recorded','source year',NULL,NULL,NULL,'e',NULL,NULL)")
        for statement in ["DELETE FROM knowledge_place_assignment", "UPDATE knowledge_place_assignment SET name_as_recorded='New name'", "INSERT INTO knowledge_place_assignment VALUES ('n','c','New name','current_admin','today',NULL,NULL,NULL,'e',NULL,NULL)"]:
            with self.assertRaises(sqlite3.IntegrityError):self.db.execute(statement)
        self.assertEqual(self.db.execute('SELECT name_as_recorded FROM knowledge_place_assignment').fetchone()[0],'Old name')
    def test_year_precision_cannot_be_filled_with_invented_day(self):
        self.db.execute("INSERT INTO knowledge_event VALUES ('v','c','Test publication','publication',1897,'1897','year','1897','e')")
        with self.assertRaises(sqlite3.IntegrityError):self.db.execute("UPDATE knowledge_event SET date_value='1897-01-01' WHERE id='v'")
        with self.assertRaises(sqlite3.IntegrityError):self.db.execute("INSERT INTO knowledge_event VALUES ('bad','c','Test','publication',2025,'2025-02-30','day','bad','e')")
    def test_memory_intake_stays_draft_even_with_publication_consent(self):
        self.db.execute("INSERT INTO knowledge_memory_intake(id,title,text,provenance,storage_consent,publication_consent) VALUES ('m','Test','Test text','Test provenance',1,1)")
        self.assertEqual(self.db.execute('SELECT status,verification FROM knowledge_memory_intake').fetchone(),('draft','unverified'))
        with self.assertRaises(sqlite3.IntegrityError):self.db.execute("UPDATE knowledge_memory_intake SET status='published'")

if __name__=='__main__':unittest.main()
