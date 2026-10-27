-- Publication policy and audit constraints; schema-only migration.
CREATE VIEW publication_eligibility AS SELECT c.*, CASE WHEN (
 c.classification IN ('official_register','source_supported')
 AND c.storage_consent=1 AND c.publish_rights=1 AND length(trim(c.rights_basis))>0 AND c.rights_reviewer IS NOT NULL
 AND length(trim(c.body))>0 AND c.approved_revision=c.revision AND c.reviewed_by IS NOT NULL
 AND ((c.latitude IS NULL AND c.longitude IS NULL) OR (c.geo_reviewed=1 AND length(trim(c.geo_basis))>0))
 AND EXISTS(SELECT 1 FROM source_citations sc WHERE sc.content_id=c.id AND sc.relation='supports' AND sc.status='accepted' AND length(trim(sc.statement))>0)
 AND NOT EXISTS(SELECT 1 FROM source_citations sc LEFT JOIN source_registry sr ON sr.id=sc.source_id
   WHERE sc.content_id=c.id AND (sc.status<>'accepted' OR sc.relation<>'supports' OR sc.reviewer IS NULL
    OR length(trim(sc.statement))=0 OR length(trim(sc.locator))=0 OR length(trim(sc.source_version))=0
    OR sr.source_type IN ('library_catalog','book_notice')
    OR (c.classification='official_register' AND (sr.source_type<>'official_register' OR sc.claim_kind<>'register_entry'))))) THEN 1 ELSE 0 END eligible FROM cultural_contents c;
--> statement-breakpoint
CREATE TRIGGER content_no_auto_publication BEFORE INSERT ON cultural_contents WHEN NEW.status <> 'draft'
BEGIN SELECT RAISE(ABORT,'New records must enter as drafts'); END;
--> statement-breakpoint
CREATE TRIGGER publication_guard BEFORE UPDATE OF status ON cultural_contents
WHEN NEW.status IN ('approved','published') AND NOT EXISTS(SELECT 1 FROM publication_eligibility WHERE id=OLD.id AND eligible=1)
BEGIN SELECT RAISE(ABORT,'Evidence, rights, version or geography is incomplete'); END;
--> statement-breakpoint
CREATE TRIGGER body_storage_guard BEFORE INSERT ON cultural_contents
WHEN (length(trim(NEW.body))>0 OR length(trim(NEW.summary))>0) AND NEW.storage_consent<>1
BEGIN SELECT RAISE(ABORT,'Storage consent required'); END;
--> statement-breakpoint
CREATE TRIGGER body_storage_guard_update BEFORE UPDATE ON cultural_contents
WHEN (length(trim(NEW.body))>0 OR length(trim(NEW.summary))>0) AND NEW.storage_consent<>1
BEGIN SELECT RAISE(ABORT,'Storage consent required'); END;
--> statement-breakpoint
CREATE TRIGGER body_invalidates_review AFTER UPDATE OF title,category,historical_area,community,body,summary,classification,latitude,longitude,geo_basis ON cultural_contents
BEGIN UPDATE cultural_contents SET approved_revision=0,status='draft',reviewed_by=NULL WHERE id=NEW.id; END;
--> statement-breakpoint
CREATE TRIGGER citation_add_invalidates_review AFTER INSERT ON source_citations
BEGIN UPDATE cultural_contents SET approved_revision=0,status='draft',reviewed_by=NULL WHERE id=NEW.content_id; END;
--> statement-breakpoint
CREATE TRIGGER citation_change_invalidates_review AFTER UPDATE ON source_citations
BEGIN UPDATE cultural_contents SET approved_revision=0,status='draft',reviewed_by=NULL WHERE id IN (NEW.content_id,OLD.content_id); END;
--> statement-breakpoint
CREATE TRIGGER citation_delete_invalidates_review AFTER DELETE ON source_citations
BEGIN UPDATE cultural_contents SET approved_revision=0,status='draft',reviewed_by=NULL WHERE id=OLD.content_id; END;
--> statement-breakpoint
CREATE TRIGGER source_change_invalidates_review AFTER UPDATE ON source_registry
BEGIN UPDATE source_citations SET status='pending',reviewer=NULL,reviewed_at=NULL WHERE source_id=NEW.id;
UPDATE cultural_contents SET approved_revision=0,status='draft',reviewed_by=NULL WHERE id IN (SELECT content_id FROM source_citations WHERE source_id=NEW.id); END;
--> statement-breakpoint
CREATE TRIGGER no_catalog_proof BEFORE INSERT ON source_citations WHEN NEW.status='accepted' AND NEW.relation='supports'
AND EXISTS(SELECT 1 FROM source_registry WHERE id=NEW.source_id AND source_type IN ('library_catalog','book_notice'))
BEGIN SELECT RAISE(ABORT,'Catalog metadata does not prove book contents'); END;
--> statement-breakpoint
CREATE TRIGGER no_catalog_proof_update BEFORE UPDATE ON source_citations WHEN NEW.status='accepted' AND NEW.relation='supports'
AND EXISTS(SELECT 1 FROM source_registry WHERE id=NEW.source_id AND source_type IN ('library_catalog','book_notice'))
BEGIN SELECT RAISE(ABORT,'Catalog metadata does not prove book contents'); END;
--> statement-breakpoint
CREATE TRIGGER no_log_update BEFORE UPDATE ON review_logs BEGIN SELECT RAISE(ABORT,'Audit log is append-only'); END;
--> statement-breakpoint
CREATE TRIGGER no_log_delete BEFORE DELETE ON review_logs BEGIN SELECT RAISE(ABORT,'Audit log is append-only'); END;
--> statement-breakpoint
CREATE TRIGGER no_revision_update BEFORE UPDATE ON content_revisions BEGIN SELECT RAISE(ABORT,'Revision history is append-only'); END;
--> statement-breakpoint
CREATE TRIGGER no_revision_delete BEFORE DELETE ON content_revisions BEGIN SELECT RAISE(ABORT,'Revision history is append-only'); END;
