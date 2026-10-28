-- PROPOSAL ONLY. Target: web D1 schema after drizzle/0000..0003.
-- Not a numbered migration; never execute against ../data/research.sqlite.
-- All existing publication guards, columns, identifiers and old names stay intact.
PRAGMA foreign_keys=ON;
CREATE TABLE knowledge_domain (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
 taxonomy_version TEXT NOT NULL
);
CREATE TABLE knowledge_content_domain (
 content_id TEXT NOT NULL REFERENCES cultural_contents(id),
 domain_id TEXT NOT NULL REFERENCES knowledge_domain(id),
 is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN(0,1)),
 reviewer TEXT NOT NULL, reviewed_at TEXT NOT NULL,
 PRIMARY KEY(content_id,domain_id)
);
CREATE UNIQUE INDEX knowledge_one_primary ON knowledge_content_domain(content_id) WHERE is_primary=1;
CREATE TABLE knowledge_scope (
 id TEXT PRIMARY KEY, content_id TEXT NOT NULL REFERENCES cultural_contents(id),
 axis TEXT NOT NULL CHECK(axis IN('region','community')),
 code TEXT NOT NULL, name_as_recorded TEXT NOT NULL,
 citation_id TEXT NOT NULL REFERENCES source_citations(id),
 reviewer TEXT NOT NULL, checked_at TEXT NOT NULL
);
CREATE TABLE knowledge_alias (
 id TEXT PRIMARY KEY, content_id TEXT NOT NULL REFERENCES cultural_contents(id),
 value TEXT NOT NULL CHECK(length(trim(value))>0), normalized_value TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN('alternate_name','historical_name','related_term','hypothesis_keyword')),
 citation_id TEXT NOT NULL REFERENCES source_citations(id),
 note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX knowledge_alias_lookup ON knowledge_alias(normalized_value);
CREATE TABLE knowledge_place_assignment (
 id TEXT PRIMARY KEY, content_id TEXT NOT NULL REFERENCES cultural_contents(id),
 name_as_recorded TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN('historical_admin','current_admin','area_as_recorded','publication_place')),
 as_of_text TEXT NOT NULL CHECK(length(trim(as_of_text))>0),
 valid_from TEXT, valid_to TEXT, checked_at TEXT,
 citation_id TEXT NOT NULL REFERENCES source_citations(id),
 supersedes_id TEXT REFERENCES knowledge_place_assignment(id), correction_reason TEXT,
 CHECK(valid_from IS NULL OR valid_to IS NULL OR valid_from<=valid_to),
 CHECK(role<>'current_admin' OR checked_at IS NOT NULL),
 CHECK(supersedes_id IS NULL OR (correction_reason IS NOT NULL AND length(trim(correction_reason))>0))
);
-- Append corrections and supersession links; never erase a recorded old name.
CREATE TRIGGER knowledge_place_no_delete BEFORE DELETE ON knowledge_place_assignment
 BEGIN SELECT RAISE(ABORT,'Historical place records are append-only'); END;
CREATE TRIGGER knowledge_place_no_update BEFORE UPDATE ON knowledge_place_assignment
 BEGIN SELECT RAISE(ABORT,'Append a corrected place record instead'); END;
CREATE TABLE knowledge_event (
 id TEXT PRIMARY KEY, content_id TEXT NOT NULL REFERENCES cultural_contents(id),
 title TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN('publication','register','observed_event')),
 year INTEGER NOT NULL, date_value TEXT NOT NULL, precision TEXT NOT NULL CHECK(precision IN('year','day')),
 source_as_written TEXT NOT NULL, citation_id TEXT NOT NULL REFERENCES source_citations(id),
 CHECK((precision='year' AND date_value=printf('%04d',year)) OR
 (precision='day' AND date_value GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND
 substr(date_value,1,4)=printf('%04d',year) AND date(date_value,'+0 days') IS NOT NULL AND date(date_value,'+0 days')=date_value))
);
CREATE TABLE knowledge_answer (
 content_id TEXT NOT NULL REFERENCES cultural_contents(id),
 question TEXT NOT NULL CHECK(question IN('what','when_where','community','origins','changes','unknowns','related')),
 state TEXT NOT NULL DEFAULT 'unknown' CHECK(state IN('supported','partial','unknown')),
 text TEXT NOT NULL, fact_kind TEXT NOT NULL CHECK(fact_kind IN('documented_history','observed_practice','folk_belief','legend','anecdote','hypothesis','explanation','community_memory','editorial_note')),
 citation_id TEXT REFERENCES source_citations(id),
 CHECK(state='unknown' OR citation_id IS NOT NULL), PRIMARY KEY(content_id,question)
);
CREATE TABLE knowledge_relation (
 id TEXT PRIMARY KEY, from_id TEXT NOT NULL REFERENCES cultural_contents(id),
 to_id TEXT NOT NULL REFERENCES cultural_contents(id),
 kind TEXT NOT NULL CHECK(kind IN('same_domain','shared_source','historical_relation','variant_of')),
 statement TEXT NOT NULL, citation_id TEXT REFERENCES source_citations(id),
 CHECK(from_id<>to_id), CHECK(kind='same_domain' OR citation_id IS NOT NULL)
);
CREATE TABLE knowledge_review (
 object_type TEXT NOT NULL CHECK(object_type IN('scope','alias','place','event','answer','relation')),
 object_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','accepted','rejected')),
 reviewer TEXT, reviewed_at TEXT, note TEXT NOT NULL DEFAULT '',
 CHECK(status<>'accepted' OR (reviewer IS NOT NULL AND length(trim(reviewer))>0 AND reviewed_at IS NOT NULL)),
 PRIMARY KEY(object_type,object_id)
);
-- Views are the only public projection for metadata. Acceptance alone cannot
-- override a stale citation or an unpublished parent content item.
CREATE VIEW knowledge_public_alias AS
 SELECT a.* FROM knowledge_alias a JOIN knowledge_review r ON r.object_type='alias' AND r.object_id=a.id AND r.status='accepted'
 JOIN source_citations s ON s.id=a.citation_id AND s.content_id=a.content_id AND s.status='accepted' AND s.relation='supports'
 JOIN publication_eligibility p ON p.id=a.content_id AND p.status='published' AND p.eligible=1;
CREATE VIEW knowledge_public_place AS
 SELECT a.* FROM knowledge_place_assignment a JOIN knowledge_review r ON r.object_type='place' AND r.object_id=a.id AND r.status='accepted'
 JOIN source_citations s ON s.id=a.citation_id AND s.content_id=a.content_id AND s.status='accepted' AND s.relation='supports'
 JOIN publication_eligibility p ON p.id=a.content_id AND p.status='published' AND p.eligible=1
 WHERE NOT EXISTS(SELECT 1 FROM knowledge_place_assignment n JOIN knowledge_review nr ON nr.object_type='place' AND nr.object_id=n.id AND nr.status='accepted' JOIN source_citations ns ON ns.id=n.citation_id AND ns.content_id=n.content_id AND ns.status='accepted' AND ns.relation='supports' WHERE n.supersedes_id=a.id);
CREATE VIEW knowledge_public_event AS
 SELECT a.* FROM knowledge_event a JOIN knowledge_review r ON r.object_type='event' AND r.object_id=a.id AND r.status='accepted'
 JOIN source_citations s ON s.id=a.citation_id AND s.content_id=a.content_id AND s.status='accepted' AND s.relation='supports'
 JOIN publication_eligibility p ON p.id=a.content_id AND p.status='published' AND p.eligible=1
 WHERE a.kind<>'register' OR s.claim_kind='register_entry';
CREATE TABLE knowledge_duplicate_review (
 left_id TEXT NOT NULL REFERENCES cultural_contents(id), right_id TEXT NOT NULL REFERENCES cultural_contents(id),
 reason TEXT NOT NULL, decision TEXT NOT NULL DEFAULT 'pending' CHECK(decision IN('pending','distinct','same_entity')),
 reviewer TEXT, note TEXT NOT NULL DEFAULT '', auto_merge INTEGER NOT NULL DEFAULT 0 CHECK(auto_merge=0),
 CHECK(left_id<right_id), CHECK(decision='pending' OR (reviewer IS NOT NULL AND length(trim(reviewer))>0)), PRIMARY KEY(left_id,right_id)
);
CREATE VIEW knowledge_public_scope AS
 SELECT a.* FROM knowledge_scope a JOIN knowledge_review r ON r.object_type='scope' AND r.object_id=a.id AND r.status='accepted'
 JOIN source_citations s ON s.id=a.citation_id AND s.content_id=a.content_id AND s.status='accepted' AND s.relation='supports'
 JOIN publication_eligibility p ON p.id=a.content_id AND p.status='published' AND p.eligible=1;
CREATE VIEW knowledge_public_answer AS
 SELECT a.* FROM knowledge_answer a JOIN knowledge_review r ON r.object_type='answer' AND r.object_id=a.content_id||':'||a.question AND r.status='accepted'
 JOIN publication_eligibility p ON p.id=a.content_id AND p.status='published' AND p.eligible=1
 LEFT JOIN source_citations s ON s.id=a.citation_id AND s.content_id=a.content_id AND s.status='accepted' AND s.relation='supports'
 WHERE a.state='unknown' OR s.id IS NOT NULL;
CREATE VIEW knowledge_public_relation AS
 SELECT a.* FROM knowledge_relation a JOIN knowledge_review r ON r.object_type='relation' AND r.object_id=a.id AND r.status='accepted'
 JOIN publication_eligibility p ON p.id=a.from_id AND p.status='published' AND p.eligible=1
 JOIN publication_eligibility q ON q.id=a.to_id AND q.status='published' AND q.eligible=1
 LEFT JOIN source_citations s ON s.id=a.citation_id AND s.content_id=a.from_id AND s.status='accepted' AND s.relation='supports'
 WHERE a.kind='same_domain' OR s.id IS NOT NULL;
CREATE TRIGGER knowledge_alias_edit AFTER UPDATE ON knowledge_alias BEGIN UPDATE knowledge_review SET status='pending' WHERE object_type='alias' AND object_id=OLD.id; END;
CREATE TRIGGER knowledge_scope_edit AFTER UPDATE ON knowledge_scope BEGIN UPDATE knowledge_review SET status='pending' WHERE object_type='scope' AND object_id=OLD.id; END;
CREATE TRIGGER knowledge_event_edit AFTER UPDATE ON knowledge_event BEGIN UPDATE knowledge_review SET status='pending' WHERE object_type='event' AND object_id=OLD.id; END;
CREATE TRIGGER knowledge_answer_edit AFTER UPDATE ON knowledge_answer BEGIN UPDATE knowledge_review SET status='pending' WHERE object_type='answer' AND object_id=OLD.content_id||':'||OLD.question; END;
CREATE TRIGGER knowledge_relation_edit AFTER UPDATE ON knowledge_relation BEGIN UPDATE knowledge_review SET status='pending' WHERE object_type='relation' AND object_id=OLD.id; END;
CREATE TRIGGER knowledge_evidence_edit AFTER UPDATE ON source_citations BEGIN
 UPDATE knowledge_review SET status='pending' WHERE
 (object_type='alias' AND object_id IN(SELECT id FROM knowledge_alias WHERE citation_id=OLD.id)) OR
 (object_type='scope' AND object_id IN(SELECT id FROM knowledge_scope WHERE citation_id=OLD.id)) OR
 (object_type='place' AND object_id IN(SELECT id FROM knowledge_place_assignment WHERE citation_id=OLD.id)) OR
 (object_type='event' AND object_id IN(SELECT id FROM knowledge_event WHERE citation_id=OLD.id)) OR
 (object_type='answer' AND object_id IN(SELECT content_id||':'||question FROM knowledge_answer WHERE citation_id=OLD.id)) OR
 (object_type='relation' AND object_id IN(SELECT id FROM knowledge_relation WHERE citation_id=OLD.id));
END;
-- Oral testimony is separately classified. Consent to store never implies
-- consent to publish. A future importer must require a separate explicit review.
CREATE TABLE knowledge_memory_intake (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, narrator_as_recorded TEXT, recorded_date TEXT,
 place_as_told TEXT, text TEXT NOT NULL, provenance TEXT NOT NULL,
 storage_consent INTEGER NOT NULL CHECK(storage_consent=1),
 publication_consent INTEGER NOT NULL DEFAULT 0 CHECK(publication_consent IN(0,1)),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status='draft'),
 verification TEXT NOT NULL DEFAULT 'unverified' CHECK(verification='unverified'),
 kind TEXT NOT NULL DEFAULT 'community_memory' CHECK(kind='community_memory')
);
-- No INSERT/UPDATE/DELETE against the existing content/source/media tables.
-- Taxonomy and metadata backfill require a separately reviewed, idempotent batch.
