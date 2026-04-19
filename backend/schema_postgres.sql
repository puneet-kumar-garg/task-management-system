-- ============================================================
-- TaskFlow — PostgreSQL Schema for Supabase
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  avatar     VARCHAR(255),
  role       VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin','manager','member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id        SERIAL PRIMARY KEY,
  team_id   INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner','manager','member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'    CHECK (status IN ('pending','in_progress','completed')),
  priority    VARCHAR(10) NOT NULL DEFAULT 'medium'     CHECK (priority IN ('low','medium','high')),
  deadline    DATE,
  creator_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignee_id INT REFERENCES users(id) ON DELETE SET NULL,
  team_id     INT REFERENCES teams(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      VARCHAR(255) NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('task','team','user')),
  entity_id   INT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Task comments (threaded)
CREATE TABLE IF NOT EXISTS task_comments (
  id         SERIAL PRIMARY KEY,
  task_id    INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  INT REFERENCES task_comments(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task attachments
CREATE TABLE IF NOT EXISTS task_attachments (
  id            SERIAL PRIMARY KEY,
  task_id       INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename      VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mimetype      VARCHAR(100),
  size          INT,
  url           VARCHAR(500) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL CHECK (type IN ('task_assigned','deadline_approaching','team_update','comment_mention')),
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  entity_type VARCHAR(50),
  entity_id   INT,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_creator    ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee   ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team       ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline   ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tm_team          ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_tm_user          ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_user       ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read       ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_comments_task    ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_task ON task_attachments(task_id);
