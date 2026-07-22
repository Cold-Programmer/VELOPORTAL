# Deploying VeloPortal — GitHub + Vercel + Render

I can't push to your GitHub account or deploy to your Vercel account myself — I have no access
to your credentials, and this environment has no internet access at all, so I can't create a
live link for you. What I *can* do is get the project fully deploy-ready (already done — see
`frontend/vercel.json` and `render.yaml`) and give you the exact steps to a working public URL.

**Why not "just Vercel"?** Vercel is excellent for the React frontend, but this backend is a
traditional long-running Express + Sequelize + PostgreSQL server, not a serverless function —
that's not what Vercel is built for. The practical, free path is:
**Vercel for the frontend** + **Render for the backend and database**. Total time: ~15–20 minutes.

---

## 1. Push to GitHub (`Cold-Programmer`)

```bash
cd veloportal
git init
git add .
git commit -m "VeloPortal — initial commit"
git branch -M main
git remote add origin https://github.com/Cold-Programmer/veloportal.git
git push -u origin main
```

(Create the empty repo first at github.com/new under your `Cold-Programmer` account if it
doesn't exist yet — name it `veloportal`, don't initialize it with a README so the push above
doesn't conflict.)

`backend/.env` and `frontend/.env` are already git-ignored, so your real secrets never get
pushed — only `.env.example` files are committed. Good; keep it that way.

---

## 2. Deploy the backend + database to Render

1. Go to render.com → sign up/sign in → **New → Blueprint**
2. Connect your GitHub account, select the `Cold-Programmer/veloportal` repo
3. Render detects `render.yaml` at the repo root automatically and proposes two resources:
   - `veloportal-backend` (web service)
   - `veloportal-db` (free PostgreSQL database)
4. Click **Apply** — Render provisions the database and builds the backend automatically
5. Once deployed, open the `veloportal-backend` service page and fill in the env vars marked
   `sync: false` in `render.yaml` (Render will prompt you for these):
   - `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY` — your Daraja sandbox values
   - `SMTP_USER`, `SMTP_PASS` — optional, for real emails (see README section 5)
   - `CLIENT_URL` — leave blank for now, come back after step 3
   - `MPESA_CALLBACK_URL` — leave blank for now, come back after this step
6. Copy your backend's public URL, shown at the top of the service page —
   it looks like `https://veloportal-backend.onrender.com`
7. Set `MPESA_CALLBACK_URL` to `https://veloportal-backend.onrender.com/api/payments/mpesa/callback`
   and save (this triggers a redeploy)
8. Open the **Shell** tab on the Render service and run the seed script once:
   ```
   npm run seed
   ```

---

## 3. Deploy the frontend to Vercel (`cold-programmer`)

1. Go to vercel.com → sign in → **Add New → Project**
2. Import the same `Cold-Programmer/veloportal` GitHub repo
3. When asked for the **Root Directory**, set it to `frontend` (important — this is a monorepo)
4. Vercel auto-detects Vite from `frontend/vercel.json`; leave build settings as-is
5. Add an environment variable:
   - `VITE_API_URL` = `https://veloportal-backend.onrender.com/api` (your Render URL from step 2, + `/api`)
6. Click **Deploy**. Vercel gives you a live URL, e.g. `https://veloportal.vercel.app`

---

## 4. Connect the two (final step)

Go back to the Render backend service → Environment → set:
- `CLIENT_URL` = `https://veloportal.vercel.app` (your real Vercel URL from step 3)

Save — this lets the backend's CORS policy accept requests from your live frontend. Render
redeploys automatically.

---

## 5. The link to send your clients

Your Vercel URL from step 3 — e.g. `https://veloportal.vercel.app` — is the one link clients
need. Everything (shop, rentals, customizer, repairs, events, community, admin console) is
reachable from there; the backend URL is only used internally by the frontend.

Demo accounts to give testers (from `npm run seed`):

| Role | Email | Password |
|---|---|---|
| Admin | admin@veloportal.app | Admin@12345 |
| Customer | rider@veloportal.app | Rider@12345 |

---

## Notes specific to a live deployment

- **Render's free tier sleeps after inactivity** — the first request after idle time takes
  10-30 seconds to wake up. Fine for client testing/demos; upgrade to a paid Render plan before
  any real launch if that matters.
- **M-Pesa STK push will now have a real, working callback URL** (your Render backend), which
  removes the biggest limitation from local development — but you're still on Daraja sandbox
  credentials, so only Safaricom's test number (254708374149) receives an actual phone prompt.
  See README section 6 for what it takes to move to production Daraja credentials.
- **Every push to `main` on GitHub auto-redeploys** both Render and Vercel by default — that's
  usually what you want, but be aware a bad commit goes live automatically unless you disable
  auto-deploy in each dashboard's settings.
- Free Render Postgres databases expire after 90 days on the free tier — fine for testing/demos,
  but note the date if this becomes a longer-lived client-facing environment.
