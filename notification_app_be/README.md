# notification_app_be

Express REST API for the notification system.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/v1/notifications | create notification |
| GET | /api/v1/notifications | get all (paginated) |
| GET | /api/v1/notifications/:id | get by id |
| PATCH | /api/v1/notifications/read-all | mark all as read |
| PATCH | /api/v1/notifications/:id/read | mark one as read |
| DELETE | /api/v1/notifications/:id | delete |

All endpoints require `Authorization: Bearer <token>` header.

## Logging

Uses the `logging_middleware` package from this repo — logs method, URL, status and response time on every request.
