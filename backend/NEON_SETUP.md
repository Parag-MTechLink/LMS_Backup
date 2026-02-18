# Integrating Neon PostgreSQL with the LMS Backend

The backend uses **SQLAlchemy** with a single `DATABASE_URL`. Neon is a serverless Postgres host; use it by pointing that URL to your Neon database.

---

## 1. Create a Neon project

1. Go to [console.neon.tech](https://console.neon.tech) and sign in.
2. **Create a project** (e.g. `lms`).
3. Choose region (e.g. **Singapore / ap-southeast-1** if you’re in India).
4. Create the project and wait for the database to be ready.

---

## 2. Get the connection string

1. In the Neon dashboard, open your project.
2. Go to **Dashboard** or **Connection Details**.
3. Copy the **connection string** (not the “pooler” one unless you want it — see below).

**Two options:**

| Type | When to use | Format |
|------|----------------|--------|
| **Direct** | Few connections, long-lived server | `postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require` |
| **Pooler** | Serverless / many short connections | `postgresql://user:password@ep-xxx-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require` |

- Your app runs as a single FastAPI process, so **either** works; **pooler** is often better if you see connection timeouts or “too many connections”.
- **Always** keep `?sslmode=require` (or add it) for Neon.

---

## 3. Configure the backend

1. Open **`lms/backend/.env`** (create from `.env.example` if needed).
2. Set the database section:

```env
# Replace with your Neon connection string from step 2
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
```

- Use your **actual** user, password, host, and database name from Neon.
- **Paste only the URL.** Do not include the `psql` command or quotes (e.g. not `psql 'postgresql://...'`). The line should be exactly `DATABASE_URL=postgresql://...` with no spaces or quotes around the URL.
- For Neon, smaller pool sizes (e.g. 5) are often enough and avoid “too many connections”.

---

## 4. Create tables

The app creates tables on startup via `Base.metadata.create_all(bind=engine)`.

1. From the backend folder, activate your venv and start the server once:

```powershell
cd c:\Users\shrey\OneDrive\Desktop\LMS\lms\backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

2. If startup completes without DB errors, tables were created. You can confirm in Neon: **SQL Editor** → `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`

If you use **Alembic** later, run migrations instead of relying on `create_all`.

---

## 5. Create your first user

A new Neon database has **no users**. If you see **"Invalid email or password"** and you’re sure the backend is running, the `users` table is likely empty.

**Option A – Seed a default Admin (recommended for first setup):**

```powershell
cd c:\Users\shrey\OneDrive\Desktop\LMS\lms\backend
.venv\Scripts\Activate.ps1
python scripts/seed_admin.py
```

Then sign in with:

- **Email:** `admin@lms.local`
- **Password:** `Admin@123`

**Option B – Use the app:** Open the **Sign up** page in the app and create an account. That user will be stored in Neon.

---

## 6. Verify

- **Neon Dashboard**: Check that the project is **Active** (not suspended). Free tier projects suspend after inactivity; the first request after resume may be slow.
- **Backend**: Call an endpoint that uses the DB (e.g. `GET /api/v1/customers` with a valid JWT). If it returns data or 401/403 (not 500), the DB connection is working.
- **Connection timeout**: If you see “Connection timed out”, check:
  - Internet and firewall (outbound port **5432** to `*.neon.tech`).
  - Correct **DATABASE_URL** (no typos, correct password).
  - Neon project not suspended (resume from dashboard if needed).

---

## 7. Optional: connection timeout in code

To fail fast when Neon is unreachable, the backend can set a **connect timeout** (see `app/core/database.py`). The default is often 30s; you can lower it (e.g. 10s) so requests don’t hang for long.

---

## 8. Lab recommendation engine (optional)

The **Lab Recommendations** page needs a **separate** Neon database with the lab_engine schema (`labs`, `tests`, `standards`, `domains`, `lab_capabilities`, etc.). If not set, the UI shows **"Lab recommendations unavailable"**.

**If you already created a Neon project named `lab_reco_engine`, do this:**

1. **Get the connection string**  
   In [Neon Console](https://console.neon.tech): open the **lab_reco_engine** project → **Connection details** → copy the connection string. Use the **pooler** one if shown (e.g. `postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`). Keep `?sslmode=require`.

2. **Apply schema and indexes** (from the lab_engine project):
   ```powershell
   cd C:\Users\shrey\OneDrive\Desktop\LMS\lab_engine
   $env:LAB_ENGINE_DATABASE_URL = "postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
   python db/apply_schema_to_url.py
   ```
   Replace the URL with your actual Neon connection string. This creates all tables and indexes.

3. **Populate the database** (run the pipeline; same URL must be set):
   ```powershell
   cd C:\Users\shrey\OneDrive\Desktop\LMS\lab_engine
   $env:LAB_ENGINE_DATABASE_URL = "postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
   python main.py
   ```
   This ingests CSVs from `data/raw_csvs/`, builds capabilities, and enriches labs (state/city). Ensure raw data exists there or the pipeline may finish with empty tables.

4. **Point the LMS backend at the same database**  
   In **`lms/backend/.env`** add (same URL as above):
   ```env
   LAB_ENGINE_DATABASE_URL=postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
   No quotes; one line.

5. **Restart the LMS backend** and reload the Lab Recommendations page. The message should disappear and filters/recommendations should work.

**Alternative (manual SQL):** You can instead run `lab_engine/db/schema.sql` and `lab_engine/db/indexes.sql` in Neon’s **SQL Editor** against the lab_reco_engine database, then run the pipeline (step 3) with the URL set.

**Quick check:** If the URL is missing or wrong, the backend logs a warning at startup and the Lab Recommendations API returns 503.

---

## 9. Migrate lab_engine from local PostgreSQL to Neon

If the lab_engine database is **already populated in local PostgreSQL** and you want to move it to your Neon **lab_reco_engine** project:

### Option A: Full dump and restore (recommended)

Use an **empty** Neon database (your existing lab_reco_engine project). No need to run the schema on Neon first—the dump includes schema and data.

1. **Dump from local PostgreSQL** (schema + data; `--no-owner --no-acl` so it works on Neon):
   ```powershell
   pg_dump -h localhost -p 5432 -U postgres -d lab_reco_engine --no-owner --no-acl -f lab_engine_backup.sql
   ```
   Use your local database name (e.g. `lab_reco_engine`) and enter the postgres password when prompted. This creates `lab_engine_backup.sql` in the current directory.

2. **Restore into Neon** (get the connection string from Neon Console → Connection details):
   ```powershell
   psql "postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require" -f lab_engine_backup.sql
   ```
   Replace the URL with your Neon **lab_reco_engine** connection string. If you see `CREATE EXTENSION` errors (e.g. uuid-ossp), you can ignore them if the extension already exists, or open `lab_engine_backup.sql` and remove/comment out the `CREATE EXTENSION` line, then run the rest.

### Option B: Data-only (Neon already has the schema)

If you already ran `apply_schema_to_url.py` on Neon and only need to **copy data**:

1. **Dump data only from local**:
   ```powershell
   pg_dump -h localhost -p 5432 -U postgres -d lab_reco_engine --data-only --no-owner --no-acl -f lab_engine_data_only.sql
   ```

2. **Restore data into Neon**:
   ```powershell
   psql "postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require" -f lab_engine_data_only.sql
   ```

### After migration

- Set **`LAB_ENGINE_DATABASE_URL`** in `lms/backend/.env` to the Neon connection string.
- Restart the LMS backend and test the Lab Recommendations page.

### Option C: Python migration script (no pg_dump/psql needed)

From the **lab_engine** project, a script can copy data from your local Postgres to Neon using only Python and `psycopg2`.

1. **Ensure Neon has the schema** (empty tables). Run once with your Neon URL:
   ```powershell
   cd C:\Users\shrey\OneDrive\Desktop\LMS\lab_engine
   $env:LAB_ENGINE_DATABASE_URL = "postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
   python db/apply_schema_to_url.py
   ```

2. **Run the migration script** (set both SOURCE and DEST):
   ```powershell
   cd C:\Users\shrey\OneDrive\Desktop\LMS\lab_engine
   $env:LAB_ENGINE_SOURCE_URL = "postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/lab_reco_engine"
   $env:LAB_ENGINE_DATABASE_URL = "postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
   python db/migrate_to_neon.py
   ```
   Replace `YOUR_LOCAL_PASSWORD` and the Neon URL with your real credentials. The script truncates the destination tables, copies all rows, and resets sequences.

3. **Point LMS at Neon** (step “After migration” above).

**Note:** You need `pg_dump` and `psql` for Option A/B (from [PostgreSQL](https://www.postgresql.org/download/windows/) or WSL). Option C only needs Python and `psycopg2` (install with `pip install psycopg2-binary` in the lab_engine environment).

---

## Quick checklist

- [ ] Neon project created and **Active**
- [ ] Connection string copied with `?sslmode=require`
- [ ] `DATABASE_URL` in `backend/.env` updated (no quotes, one line)
- [ ] Backend started at least once to create tables
- [ ] First user created (run `python scripts/seed_admin.py` or use Sign up)
- [ ] Login works; test request to an API returns 200/401/403 (not 500/503)
- [ ] (Optional) Lab Recommendations: second DB created, schema + data from lab_engine, `LAB_ENGINE_DATABASE_URL` set in `.env`, backend restarted

Your backend is already configured to use `DATABASE_URL` and recycles connections for Neon; no code changes are required beyond setting `.env` correctly.
