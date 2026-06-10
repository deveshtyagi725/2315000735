# Stage 1 – Notification System API Design

**Project:** Afford Medical Drive  
**Date:** July 2025

---

ok so for Stage 1 I need to design the notification system REST API. I'll cover the endpoints, the data model, auth, real-time delivery and a few other things like pagination and validation. Going to try keep this structured but also move fast.

---

## Assumptions

Few things I'm assuming since the brief didn't spell everything out:

- Notifications are created by the system/server, not the user. A user can't POST a notification to themselves — that doesn't make sense.
- Each notification is owned by one user. No group notifications.
- I'm going with soft delete. Don't actually remove the row, just flag it. Especially for a medical platform you probably want an audit trail.
- userId always comes from the JWT — I'm not accepting it in the request body. That's just asking for someone to spoof it.
- All times in UTC, ISO 8601 e.g. `2025-07-14T09:00:00Z`
- Default pagination: page=1, limit=10. Max limit I'll allow is 100.
- For real-time I'm going with SSE not WebSockets. More on that in section 8.

---

## Notification Types

| Type constant | What triggers it |
|---------------|-----------------|
| Placement | campus placement drive or talk |
| Result | exam results or marks update |
| Event | college event, workshop, fest |

---

## Data Model

```json
{
  "id": "notif_9f4c2a1b3e",
  "userId": "usr_7d2e9c4b1f",
  "type": "Placement",
  "title": "Placement Drive – TCS",
  "message": "TCS campus drive on Aug 5. Register before Aug 2.",
  "isRead": false,
  "isDeleted": false,
  "priority": "HIGH",
  "category": "SYSTEM",
  "actionUrl": null,
  "metadata": null,
  "createdAt": "2025-07-14T10:30:00Z",
  "readAt": null,
  "expiresAt": null
}
```

| field | type | required | notes |
|-------|------|----------|-------|
| id | string | yes | server generated |
| userId | string | yes | from JWT only |
| type | string | yes | Placement / Result / Event |
| title | string | yes | short heading |
| message | string | yes | full text |
| isRead | boolean | yes | default false |
| isDeleted | boolean | yes | soft delete flag |
| priority | string | yes | LOW / NORMAL / HIGH / URGENT |
| category | string | yes | AUTH / DOCUMENT / APPOINTMENT / SYSTEM / SECURITY |
| actionUrl | string | no | optional deep link |
| metadata | object | no | flexible extra context |
| createdAt | string | yes | server-set timestamp |
| readAt | string | no | null until read |
| expiresAt | string | no | null = no expiry |

---

## Auth

```
Authorization: Bearer <jwt_token>
```

JWT issued at login. Middleware decodes it, sets `req.user.id`. Never trust userId from request body.

- No token → 401
- Expired → 401
- Wrong user → 403

---

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### POST /notifications
Create a notification (admin/service only).

**Body:**
```json
{
  "userId": "usr_7d2e9c4b1f",
  "type": "Placement",
  "title": "Placement Drive – TCS",
  "message": "TCS campus drive on Aug 5.",
  "priority": "HIGH",
  "category": "SYSTEM"
}
```
**Success → 201** returns full notification object.

---

### GET /notifications
Get all notifications for logged-in user. Supports `page`, `limit`, `type`, `isRead`, `sortBy`, `sortOrder`.

**Success → 200** returns `{ notifications, pagination, unreadCount }`.

---

### GET /notifications/:id
Get one notification. Returns 403 if it doesn't belong to the requesting user.

---

### PATCH /notifications/:id/read
Mark one as read. Returns 409 if already read.

---

### PATCH /notifications/read-all
Mark all unread as read. Returns `{ updatedCount, readAt }`.

---

### DELETE /notifications/:id
Soft delete. Sets `isDeleted=true`, `deletedAt=now`.

---

## Status Codes

| code | when |
|------|------|
| 200 | success |
| 201 | created |
| 400 | bad input |
| 401 | no/expired token |
| 403 | not your resource |
| 404 | not found |
| 409 | already read/deleted |
| 500 | server error |

---

## Real-time – SSE

Notifications go one way (server → client), so SSE is enough. No need for WebSockets.

```
GET /notifications/stream
Authorization: Bearer <token>
Accept: text/event-stream
```

Events:
```
event: notification
data: { id, type, title, message, createdAt }

event: unread_count
data: { unreadCount: 5 }

event: ping
data: { timestamp: "..." }
```

Heartbeat every 30s to keep connection alive. Client auto-reconnects on drop.

---

*Stage 1 done*

---

# Stage 2 – Database Design

Going with PostgreSQL.

---

## Why PostgreSQL

- ACID — don't want inconsistent data on a medical platform
- JSONB support for the `metadata` column
- Solid indexing for the kinds of queries this app needs
- UUID support via `gen_random_uuid()`
- Can scale with read replicas or partitioning later

Considered MongoDB briefly since metadata is flexible JSON, but the rest of the data is relational. Not worth losing foreign keys and transactions for one column.

---

## Schema

### Users

```sql
CREATE TABLE users (
    id         UUID PRIMARY KEY,
    name       VARCHAR(100),
    email      VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notifications

```sql
CREATE TABLE notifications (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(20)  NOT NULL,
    title       VARCHAR(120) NOT NULL,
    message     VARCHAR(500) NOT NULL,
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    is_deleted  BOOLEAN      NOT NULL DEFAULT FALSE,
    priority    VARCHAR(10)  NOT NULL DEFAULT 'NORMAL',
    category    VARCHAR(20)  NOT NULL,
    action_url  VARCHAR(500),
    metadata    JSONB,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at     TIMESTAMP,
    expires_at  TIMESTAMP,
    deleted_at  TIMESTAMP
);
```

### Check Constraints

```sql
ALTER TABLE notifications ADD CONSTRAINT chk_type
    CHECK (type IN ('Placement', 'Result', 'Event'));

ALTER TABLE notifications ADD CONSTRAINT chk_priority
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));

ALTER TABLE notifications ADD CONSTRAINT chk_category
    CHECK (category IN ('AUTH', 'DOCUMENT', 'APPOINTMENT', 'SYSTEM', 'SECURITY'));
```

Using check constraints over ENUMs — easier to change later without painful migrations.

---

## Indexes

```sql
CREATE INDEX idx_notif_user_created
    ON notifications (user_id, created_at DESC)
    WHERE is_deleted = FALSE;

CREATE INDEX idx_notif_user_unread
    ON notifications (user_id, is_read)
    WHERE is_deleted = FALSE;

CREATE INDEX idx_notif_user_type
    ON notifications (user_id, type)
    WHERE is_deleted = FALSE;

CREATE INDEX idx_notif_expires_at
    ON notifications (expires_at)
    WHERE expires_at IS NOT NULL AND is_deleted = FALSE;
```

Partial indexes on `is_deleted = FALSE` — deleted rows never show in queries so no point indexing them.

---

## ER Diagram

```
┌──────────────┐          ┌──────────────────────────────┐
│    users     │          │       notifications           │
├──────────────┤          ├──────────────────────────────┤
│ id (PK)      │◄─────────│ user_id (FK)                 │
│ name         │  1 to *  │ id, type, title, message     │
│ email        │          │ is_read, is_deleted          │
│ created_at   │          │ priority, category           │
└──────────────┘          │ metadata (JSONB)             │
                          │ created_at, read_at          │
                          └──────────────────────────────┘
```

---

## Sample Queries

```sql
-- list with optional filters
SELECT id, type, title, message, is_read, priority, created_at
FROM notifications
WHERE user_id = $1 AND is_deleted = FALSE
  AND ($2::varchar IS NULL OR type = $2)
  AND ($3::boolean IS NULL OR is_read = $3)
ORDER BY created_at DESC
LIMIT $4 OFFSET $5;

-- unread count
SELECT COUNT(*) FROM notifications
WHERE user_id = $1 AND is_read = FALSE AND is_deleted = FALSE;

-- mark one read
UPDATE notifications SET is_read = TRUE, read_at = NOW()
WHERE id = $1 AND user_id = $2 AND is_read = FALSE AND is_deleted = FALSE
RETURNING id, read_at;

-- soft delete
UPDATE notifications SET is_deleted = TRUE, deleted_at = NOW()
WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE
RETURNING id, deleted_at;

-- cron cleanup
UPDATE notifications SET is_deleted = TRUE, deleted_at = NOW()
WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_deleted = FALSE;
```

---

*Stage 2 done*

---

# Stage 3 – Query Optimisation

stage 3 is about making sure the queries from stage 2 don't fall apart when the table gets large. going to keep this focused on the actual problem areas.

the main query that gets hit on every page load:

```sql
SELECT id, type, title, message, is_read, priority, created_at
FROM notifications
WHERE user_id = $1 AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

without an index this does a full scan on every request. with 5M+ rows that becomes a problem fast.

the fix is the composite index already added in stage 2:
```sql
CREATE INDEX idx_notif_user_created
    ON notifications (user_id, created_at DESC)
    WHERE is_deleted = FALSE;
```

this lets postgres jump straight to the user's rows, already sorted, and slice the LIMIT off the top. much cheaper.

**COUNT(*) for pagination** — running a separate count query with the same filters doubles the work. two options:
1. cache the count in Redis, invalidate when notifications change
2. switch to cursor pagination — pass last seen `created_at` instead of page number, skip COUNT entirely

cursor approach:
```sql
SELECT ...
FROM notifications
WHERE user_id = $1 AND is_deleted = FALSE
  AND created_at < $2
ORDER BY created_at DESC
LIMIT 10;
```

stays fast no matter how deep you paginate. downside is you can't jump to page 5 directly but that's fine for a notification feed.

**unread count** — this hits on every page load too for the badge. the partial index on `(user_id, is_read)` covers it. if still slow at scale, cache it per user in Redis with a short TTL and bust the cache on read/create.

**OFFSET problem** — OFFSET N still scans the first N rows even if you don't return them. for a notification feed cursor pagination is better long term.

**soft deletes and bloat** — over time `is_deleted = TRUE` rows pile up and slow down VACUUM. a weekly job that hard-deletes anything older than 90 days with `is_deleted = TRUE` keeps the table clean.

if I had more time I'd run `EXPLAIN ANALYZE` on each query and check for seq scans, bad row estimates (need `ANALYZE`), or sorts happening outside the index.

---

# Stage 4 – Scaling

right now it's one Node process and one Postgres. that breaks in a few places once users grow.

**DB reads vs writes** — GET /notifications is called constantly, writes (mark read, create) are less frequent. put a read replica in front, route GETs there and only send writes to primary.

```
GET  → read replica
POST/PATCH/DELETE → primary
```

**SSE at scale** — if 10k users have open SSE connections on one server, that's fine for Node since it's non-blocking. but if I scale to multiple Node instances the problem is: user A's SSE connection is on server 1, but the notification gets created on server 2. server 2 has no connection to push to.

fix: Redis pub/sub. when any instance creates a notification it publishes to a Redis channel keyed by userId. all instances subscribe and push to whichever connections they hold.

**connection pooling** — without pgBouncer, 5 Node instances each with a pool of 10 = 50 Postgres connections. that adds up. pgBouncer sits in front and multiplexes so Postgres only sees a sensible number of connections.

**table partitioning** — partition notifications by month. queries with date ranges only hit the relevant partition. old partitions can be archived without touching live data.

```sql
CREATE TABLE notifications (...) PARTITION BY RANGE (created_at);
CREATE TABLE notifications_2025_07 PARTITION OF notifications
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
```

**caching** — unread count per user in Redis (30s TTL). not worth caching the full list since it's per-user and changes frequently.

**rate limiting** — express-rate-limit on write endpoints, maybe 30 req/min per user. SSE max 3 connections per user.

---

# Stage 5 – Bulk Notifications

scenario: send a Placement notification to all 50k eligible students at once.

doing this synchronously in a request handler is wrong:
```js
for (const user of users) {
  await db.insert(notification for user)  // 50k awaits, request times out
}
```

**the approach** — accept the request, push it to a job queue, return 202 immediately. worker processes it in the background.

```
POST /notifications/bulk
  → validate
  → push job to queue
  → return 202

(background worker)
  → fetch eligible user IDs in batches of 500
  → bulk INSERT per batch
  → push SSE to online users via Redis
```

I'd use BullMQ (Redis-backed) for the queue. handles retries, concurrency, job status out of the box.

**bulk insert** — one INSERT with 500 rows at a time instead of 500 individual INSERTs:
```sql
INSERT INTO notifications (user_id, type, title, message, priority, category, created_at)
VALUES ($1,$2,$3,$4,$5,$6,NOW()), ($7,$2,$3,$4,$5,$6,NOW()), ...;
```

**retries** — exponential backoff: 5s, 10s, 20s, then dead letter queue.

**idempotency** — if worker crashes mid-batch and restarts it might reinsert. prevent this by tracking `jobId + batchIndex` in Redis before each batch. if already processed, skip.

**job status tracking**:
```sql
CREATE TABLE bulk_jobs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status     VARCHAR(20) DEFAULT 'pending',
    total      INTEGER,
    processed  INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

# Stage 6 – Priority Inbox Algorithm

the priority page needs to rank notifications — not just by time but by importance.

ranking rule from the spec: Placement > Result > Event, then recency within same type.

each notification gets a score:

```js
const TYPE_RANK = { Placement: 3, Result: 2, Event: 1 }

function score(n) {
  const t = TYPE_RANK[n.type] || 0
  const age = new Date(n.createdAt).getTime() / 1e12
  return t * 10 + age
}
```

the `* 10` makes sure type always wins. two Placement notifications then sort by recency between themselves.

example:

| type | age | score |
|------|-----|-------|
| Placement | 2 days ago | ~31.7 |
| Result | 30 min ago | ~21.7 |
| Event | 5 min ago | ~11.7 |

Placement from 2 days ago still beats Result from 30 mins ago.

I did this in the frontend because the score is time-dependent — a precomputed DB column would go stale. for small datasets (top 10) computing client-side is fine.

if it needed to be server-side:
```sql
ORDER BY
  CASE type WHEN 'Placement' THEN 3 WHEN 'Result' THEN 2 ELSE 1 END * 10
  + EXTRACT(EPOCH FROM created_at) / 1e9
DESC LIMIT 10;
```

Top N selector (3/5/10) is just `.slice(0, n)` on the sorted array.

things I'd improve with more time: boost unread notifications of same type, add time decay so very old notifications lose rank faster.
