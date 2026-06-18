# Orkesta Labs — Herramienta de Administración Financiera

Welcome! This guide walks you through setting up the Orkesta Labs financial
admin tool from scratch. It is written for a **non-technical user** — you do not
need to be a programmer. Just follow the steps in order.

---

## 1. What this is

This is a small web application for **Orkesta Labs, S.A.P.I. de C.V.** that helps
the team track the company's finances: shareholders and capital, employees,
fixed and variable costs, income and expenses, cash movements, clients, and the
24-month financial plan. The data lives in a **Supabase** database (a hosted
Postgres database with built-in login), and the app is a Next.js website.

When you are done, you will have:
- A Supabase database with all the tables and seed data.
- The app running on your computer at `http://localhost:3000`.
- (Optionally) the app deployed online via Vercel.

---

## 2. Create a Supabase project

1. Go to **https://supabase.com** and sign in (create a free account if needed).
2. Click **New project**.
3. Give it a name (e.g. `orkesta-labs`), choose a region close to Mexico
   (e.g. `East US` or `Central`), and set a strong database password
   (save this password somewhere safe).
4. Click **Create new project** and wait a minute or two while it provisions.

---

## 3. Get your credentials

Once the project is ready:

1. In the left sidebar, open **Project Settings** (the gear icon).
2. Click **API**.
3. You will need three values — copy them somewhere temporary:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (a long string under "Project API keys")
   - **service_role** key (another long string — keep this one secret!)

---

## 4. Get the code and set up your environment file

1. Clone (download) the repository to your computer. If you have the Git tool:
   ```
   git clone <repository-url>
   cd <project-folder>
   ```
   (If you are not comfortable with Git, ask a teammate to share the folder.)

2. Create your local environment file by copying the example:
   ```
   cp .env.example .env.local
   ```

3. Open `.env.local` in a text editor and fill in the three values from Step 3:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   Save the file.

---

## 5. Create the database tables (run migrations)

1. In Supabase, open the **SQL Editor** from the left sidebar.
2. Click **New query**.
3. Open the file `supabase/migrations/001_initial_schema.sql` from the project,
   copy **all** of its contents, paste it into the SQL Editor, and click **Run**.
   This creates every table, the automatic timestamps, the cash-movement
   automations, and turns on security.
4. Open a **new query** again. Open `supabase/migrations/002_rls_policies.sql`,
   copy all of it, paste, and click **Run**. This sets who can read and edit
   the data.

You should see "Success" after each run.

---

## 6. Load the starting data (run the seed)

1. In the SQL Editor, open **another new query**.
2. Open `supabase/seed.sql`, copy all of its contents, paste, and click **Run**.

This loads the company configuration, shareholders, employees, costs, pricing
models, and the 24-month plan. Numbers that are still **"por confirmar"** are
intentionally set to `0` so you can fill them in later.

---

## 7. Run the app on your computer

In a terminal, inside the project folder:

```
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## 8. Log in (magic link) and become a director

1. On the login screen, enter your email address and request a **magic link**.
2. Check your inbox and click the link — that logs you in.
3. The first time you log in, your user exists but has read-only access.
   To make yourself a **director** (full edit access), go back to the Supabase
   **SQL Editor**, open a new query, and run:

   ```sql
   insert into perfiles (id, email, rol)
   select id, email, 'director' from auth.users;
   ```

   This copies your authenticated user into the `perfiles` table with the
   `director` role. Reload the app and you will have full access.

   > Tip: if you only want **one specific person** to be a director, add a
   > `where email = 'their@email.com'` at the end of that query.

---

## 9. Deploy online with Vercel (optional)

To put the app on the internet:

1. Push the project to a **GitHub** repository.
2. Go to **https://vercel.com**, sign in, and click **Add New → Project**.
3. **Import** your GitHub repository.
4. In the project settings, add the same three environment variables from your
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Deploy**. After a minute, Vercel gives you a public URL.

That's it — you now have Orkesta's financial tool live.

---

### Need to update numbers later?

Most "por confirmar" values (founder salaries, capital amounts, retail tier
prices, the months 2–24 of the plan) start at `0`. Once they are confirmed,
update them directly in the app (as a director) or in the Supabase **Table
Editor**.
