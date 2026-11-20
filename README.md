# Wayfarer — vehicle booking site

React + Tailwind CSS front end, Node/Express API, MongoDB (Mongoose). "Wayfarer" and all contact
details are **placeholders** — replace them in `client/src/lib/site.js`.

```
wayfarer/
├─ client/   Vite + React 18 + Tailwind 3 + react-router
│  └─ src/  components/ (Header, Footer, VehicleCard, StatusBadge, Modal, Field, AvailabilityCalendar…)
│            pages/ (Home, Booking, Gallery, About, Contact)   admin/ (dashboard, bookings, schedule, vehicles)
└─ server/   Express + Mongoose
   └─ src/   models/  routes/ (public, admin)  services/ (availability, storage)  lib/  seed.js
```

## Run it

Requirements: Node 20.6+ and a MongoDB (local, Docker, or Atlas).

```bash
# 1. MongoDB – pick one
docker run -d --name wf-mongo -p 27017:27017 mongo:7        # local via Docker
#    …or create a free Atlas cluster and copy its connection string

# 2. install everything
npm run install:all

# 3. configure secrets (never commit server/.env)
cp server/.env.example server/.env
#    edit server/.env: MONGODB_URI, JWT_SECRET (long random), SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD

# 4. load sample vehicles/bookings and create the first admin
npm run seed            # add -- --reset to wipe vehicles/bookings first

# 5. start API (:5000) and web app (:5173)
npm run dev
```

Open http://localhost:5173 · admin: http://localhost:5173/admin (sign in with the seeded admin).

**Production:** `npm run build` then `NODE_ENV=production npm start` — Express serves `client/dist` and the
API from one origin (this keeps the admin cookie `SameSite=Strict`). Put it behind HTTPS.

### Deploy to Vercel

The repository includes a Vercel setup for the React site and Express API on one domain. Push the project root
(the folder containing this README and `vercel.json`) to GitHub, import that repository in Vercel, and keep the
project root as the Root Directory. The Vercel config installs both workspaces and builds the Vite files into
Vercel's `public/` directory; the Express app is exported as a Vercel Function.

Before deploying, add these Vercel Environment Variables for Production (and Preview if needed):

* `MONGODB_URI` — a working MongoDB Atlas connection string and database user.
* `JWT_SECRET` — a unique random value of at least 32 characters.
* `BUSINESS_TIMEZONE` — for example `Asia/Kolkata`.
* `STORAGE_DRIVER=cloudinary`, plus `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

Use a persistent image service such as Cloudinary; Vercel Function local storage is not persistent. Configure
Atlas Network Access to permit the Vercel function's outbound connection, preferably with Vercel Static IPs where
available; avoid opening Atlas to every IP. After setting variables, deploy or redeploy. Create only the production
admin by running `npm run seed:admin` locally with `server/.env` pointed at the production Atlas database and
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` set. Keep these secrets out of Git.

Tests (no database needed): `npm test` — validation, date-overlap rules, and the confirm/lock algorithm
including simultaneous confirmations.

### Environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (secret) |
| `JWT_SECRET` | Signs admin session cookies; ≥ 32 chars in production (secret) |
| `CLIENT_ORIGIN` | Only needed if the client is hosted on a different origin |
| `BUSINESS_TIMEZONE` | IANA zone used for "today"/"past time" checks (e.g. `Asia/Kolkata`) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | First admin, used only by `npm run seed` |
| `STORAGE_DRIVER` | `local` (files in `server/uploads`) or `cloudinary` |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | Required when `STORAGE_DRIVER=cloudinary` |

## How availability is enforced

* Customers can only **request** a booking → always saved as `pending`. Pending requests hold **no dates**.
* Only an admin can **confirm**. `confirmBooking()` (server/src/services/availability.js):
  1. looks for confirmed bookings overlapping the **whole range** (`existing.start ≤ req.end && existing.end ≥ req.start`);
  2. claims one `BookingLock` document per day with a **unique `(vehicle, day)` index**;
  3. flips `pending → confirmed` with a conditional update; on any failure it releases its locks.
* Because the database itself rejects a second claim on the same vehicle-day, two near-simultaneous
  confirmations cannot both succeed — and this works on a standalone MongoDB (no replica set needed).
* The booking page shows the live result as **Available / Unavailable / Pending**, blocks sending when
  unavailable, and handles a `409` if a conflict appears between checking and sending.
* Cancel/reject releases the locks. A startup `reconcileLocks()` removes any orphan locks after a crash.

## API

Public: `GET /api/vehicles`, `GET /api/trip-photos`, `GET /api/reviews`, `GET /api/packages`, `GET /api/bookings/history?phone=...`,
`POST /api/feedback`, `GET /api/vehicles/:id`, `GET /api/vehicles/:id/busy`,
`GET /api/vehicles/:id/availability?startDate&endDate`, `POST /api/bookings`,
`GET /api/bookings/track?reference&email`, `POST /api/contact`.

Admin (cookie session): `POST /api/admin/login|logout`, `GET /api/admin/me|stats`,
`GET|POST /api/admin/trips`, `DELETE /api/admin/trips/:id`, `GET /api/admin/feedback`,
`GET|POST /api/admin/packages`, `DELETE /api/admin/packages/:id`,
`GET /api/admin/bookings[/:id]`, `PATCH /api/admin/bookings/:id/status`,
`GET|POST /api/admin/vehicles`, `PUT|DELETE /api/admin/vehicles/:id`,
`POST /api/admin/vehicles/:id/images` (multipart: `images[]` + `altTexts[]`),
`PATCH|DELETE /api/admin/vehicles/:id/images/:imageId`.

## Still needed before taking real bookings

* **Auth hardening** – the admin has email/password + httpOnly cookie + login rate-limit, but add MFA,
  password reset, account lockout, multiple roles and audit logs. Use a strong `JWT_SECRET`; serve over HTTPS only.
* **Managed database** – Atlas (or similar) with backups and alerting; restrict network access; use a
  least-privilege DB user. Keep the `(vehicle, day)` unique index in place.
* **Hosted image storage** – switch to Cloudinary/S3 (local disk is lost on most hosts); consider
  image resizing and malware scanning.
* **Notifications** – confirmation/rejection emails or SMS (none are sent yet; staff contact customers manually).
* **Operational** – real brand/contact content and photos, privacy policy & consent, spam protection
  (CAPTCHA) on public forms, monitoring/logging, and a deployment pipeline.
* **Product gaps** – no payments/pricing, no vehicle maintenance date-blocking (only an on/off setting),
  and no editing of a booking's dates after submission (cancel and re-request).
* **Not yet run end-to-end** – this was written without network/package access, so it has been
  syntax-checked and unit-tested but not launched against MongoDB or built with Vite/Tailwind.
  Run through the checklist above (`npm run dev`, book, confirm, double-confirm) once installed.
