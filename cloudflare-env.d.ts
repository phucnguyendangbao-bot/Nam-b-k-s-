declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OWNER_PRIVATE_SETUP?: string;
    REVIEWED_RELEASE_AUTH?: string;
  }
}
