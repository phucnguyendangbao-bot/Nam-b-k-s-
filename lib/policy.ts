export type Role='admin'|'editor'|'researcher'|'contributor'|'visitor';
export const canEdit=(role:string)=>['admin','editor','researcher'].includes(role);
export const canReview=(role:string)=>['admin','editor'].includes(role);
export const canAdmin=(role:string)=>role==='admin';
export const canResearch=(role:string)=>['admin','editor','researcher'].includes(role);
export function assertAllowed(value:unknown,message:string):asserts value { if(!value)throw new Error(message); }
export function rightsCanStore(body:string,consent:boolean){return !body.trim()||consent;}
export function validCoordinates(lat:number|null,lon:number|null){return lat===null&&lon===null||lat!==null&&lon!==null&&Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;}
export const eligibilitySQL=`
 c.classification IN ('official_register','source_supported')
 AND c.storage_consent=1 AND c.publish_rights=1 AND length(trim(c.rights_basis))>0 AND c.rights_reviewer IS NOT NULL
 AND length(trim(c.body))>0 AND c.approved_revision=c.revision AND c.reviewed_by IS NOT NULL
 AND ((c.latitude IS NULL AND c.longitude IS NULL) OR (c.geo_reviewed=1 AND length(trim(c.geo_basis))>0))
 AND EXISTS(SELECT 1 FROM source_citations sc WHERE sc.content_id=c.id AND sc.relation='supports' AND sc.status='accepted' AND length(trim(sc.statement))>0)
 AND NOT EXISTS(SELECT 1 FROM source_citations sc LEFT JOIN source_registry sr ON sr.id=sc.source_id
   WHERE sc.content_id=c.id AND (sc.status<>'accepted' OR sc.relation<>'supports' OR sc.reviewer IS NULL
    OR length(trim(sc.statement))=0 OR length(trim(sc.locator))=0 OR length(trim(sc.source_version))=0
    OR sr.source_type IN ('library_catalog','book_notice')
    OR (c.classification='official_register' AND (sr.source_type<>'official_register' OR sc.claim_kind<>'register_entry'))))`;
