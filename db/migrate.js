import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
      }
);

async function createMissingTables() {
  try {
    console.log("🔍 Creating/verifying all database tables...");

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            VARCHAR(255) NOT NULL,
        email           VARCHAR(255) NOT NULL UNIQUE,
        password_hash   VARCHAR(255) NOT NULL,
        avatar          TEXT DEFAULT '',
        bio             TEXT DEFAULT '',
        is_private      BOOLEAN DEFAULT FALSE,
        email_notifications BOOLEAN DEFAULT TRUE,
        push_notifications  BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ Users table verified");

    // Create posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title           VARCHAR(500) NOT NULL,
        excerpt         TEXT DEFAULT '',
        content         TEXT NOT NULL DEFAULT '',
        featured_image  TEXT DEFAULT '',
        category        VARCHAR(100) DEFAULT 'Personal',
        status          VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        read_time       INTEGER DEFAULT 1,
        shares          INTEGER DEFAULT 0,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ Posts table verified");

    // Create comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text       TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ Comments table verified");

    // Create likes table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, post_id)
      )
    `);
    console.log("✅ Likes table created/verified");

    // Create bookmarks table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, post_id)
      )
    `);
    console.log("✅ Bookmarks table created/verified");

    // Create reactions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        emoji   VARCHAR(10) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, post_id)
      )
    `);
    console.log("✅ Reactions table created/verified");

    // Create comment_likes table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, comment_id)
      )
    `);
    console.log("✅ Comment likes table created/verified");

    // Create post_tags table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        tag     VARCHAR(100) NOT NULL,
        PRIMARY KEY (post_id, tag)
      )
    `);
    console.log("✅ Post tags table created/verified");

    // Create follows table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (follower_id, following_id),
        CHECK (follower_id <> following_id)
      )
    `);
    console.log("✅ Follows table created/verified");

    // Add is_superuser to users and drop NOT NULL constraint on password_hash for OAuth
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    `);
    console.log("✅ Users schema updated (is_superuser column & nullable password_hash)");

    // Update posts status check constraint to support pending, approved, rejected
    await pool.query(`
      ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
      ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published'));
    `);
    console.log("✅ Posts status check constraint updated");

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        message     TEXT NOT NULL,
        type        VARCHAR(50) DEFAULT 'info',
        link        TEXT DEFAULT '',
        is_read     BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("✅ Notifications table created/verified");

    // Create post_reads table for true analytics calculation
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_reads (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id       UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
        session_id    VARCHAR(255),
        read_duration INTEGER DEFAULT 0,
        scroll_depth  INTEGER DEFAULT 0,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_post_reads_post ON post_reads(post_id);
    `);
    console.log("✅ Post reads table created/verified");

    // Add parent_id to comments for replies / sub-comments
    await pool.query(`
      ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
    `);
    console.log("✅ Comments parent_id column verified");

    console.log("\n✅ All tables successfully created/verified!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating tables:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createMissingTables();
