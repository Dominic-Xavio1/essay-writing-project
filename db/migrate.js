import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function createMissingTables() {
  try {
    console.log("🔍 Creating missing tables...");

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
