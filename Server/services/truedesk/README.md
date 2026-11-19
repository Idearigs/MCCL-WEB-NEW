# Truedesk Cloud connector (website live chat ⇄ Truedesk app)

Staff answer website chats from the Truedesk iPhone app. The website keeps its own chat (tables,
widget, staff PWA, admin pages, Socket.io) and mirrors it to Truedesk Cloud as a paired device of
kind `website`. Contract: `truedesk-cloud/contract/CONTRACT.md` §3, brief:
`truedesk-cloud/contract/WEBSITE_INTEGRATION.md`.

**Off by default.** Unless `TRUEDESK_ENABLED=true` (with `TRUEDESK_URL` and `TRUEDESK_TOKEN`), nothing
here runs, no outbox rows are written and no request goes to the cloud.

| File | What it does |
|---|---|
| `config.js` | Env settings, on/off, "disconnected after a 401" |
| `mapping.js` | Website rows ⇄ contract fields (pure; tested against the contract fixtures) |
| `outbox.js` | Writes `truedesk_outbox` rows **in the same transaction** as the chat change |
| `worker.js` | Sends the outbox every 5 s and on enqueue: batches of 200, photo blobs first, back-off 5 s / 30 s / 2 min / 10 min |
| `inbound.js` | Keeps `GET /v1/sync/events` open, pulls on `ready`/`change` and every 60 s, applies each page + cursor in one transaction, emits after commit |
| `client.js` | HTTP calls; the token is only ever sent in the Authorization header |
| `index.js` | Start-up and the one-time 30-day backfill |
| `../chatService.js` | The single path for every message and status change (web visitor, web staff, app reply) |

## Going live

1. **Deploy** this code. Migration `021_truedesk_chat_sync.sql` is applied automatically at start-up
   (idempotent). The chat works exactly as before while the flag is off.
2. **Storage:** make sure the Coolify persistent volume on MCCL-BACKEND covers `/app/uploads`
   (chat photos are saved there as `chat-….jpg`), not only `/app/uploads/products`.
3. **Staff row:** in the backend container, `node scripts/truedesk-staff-user.js`. It prints
   `TRUEDESK_STAFF_SENDER_ID=<uuid>` (an inactive "Truedesk App" admin user that can never sign in).
4. **Pair:** make a code on the cloud (`npm run cli -- pair --slug mcculloch` in truedesk-cloud), then
   in the backend container `node scripts/truedesk-pair.js <CODE>`. It prints the token once.
5. **Coolify env (MCCL-BACKEND):** `TRUEDESK_URL=https://cloud.truedesk.co.uk`, `TRUEDESK_TOKEN`
   (secret), `TRUEDESK_STAFF_SENDER_ID`, `TRUEDESK_ENABLED=true`. **Redeploy** (a Restart does not
   apply changed env vars).
6. The log shows `Truedesk Cloud sync running (cloud.truedesk.co.uk)`; recent chats (30 days) are
   queued once for the phones.

Optional: `CHAT_REPLY_EMAILS=true|false` turns the "we replied" email on or off independently (by
default it follows `TRUEDESK_ENABLED`).

## Operating notes

- **401 from the cloud** (website unpaired): logged once, syncing stops, the chat keeps working.
  Changes made while disconnected are not queued; pair again, set the new token and redeploy.
- **Dead rows:** a `400 contract_violation` parks that one row as `status = 'dead'` (`last_error`
  names the field, never its content): `SELECT id, collection, record_id, last_error FROM truedesk_outbox WHERE status = 'dead';`
- **Backlog:** `SELECT status, count(*) FROM truedesk_outbox GROUP BY 1;`
- **Single process only.** The worker and stream run in-process with `setInterval(...).unref()`, like
  the secure-viewing purge. Running two backend replicas would send twice (harmless, idempotent) but
  Socket.io itself also assumes one process.
- **Time zone.** Chat times are `TIMESTAMP` without a zone and the container runs in UTC. The
  connector warns at start-up if the process is not in UTC.

## Tests

```sh
# disposable local Postgres (never production)
docker run -d --rm --name mccl-chat-test -e POSTGRES_USER=mccl_test -e POSTGRES_PASSWORD=test-only \
  -e POSTGRES_DB=mccl_test -p 127.0.0.1:55433:5432 postgres:17-alpine
TEST_PG_URL=postgres://mccl_test:test-only@127.0.0.1:55433/mccl_test node --test --test-concurrency=1 tests/truedesk/
```
