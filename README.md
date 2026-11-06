# 🐢 Shurtle

An open source, blazingly fast URL shortener built with Next.js 16, React 19 and modern web technologies. Shurtle makes it easy to create, manage and track short links with a polished, accessible interface.

**Live:** [shurtle.app](https://shurtle.app)

## ✨ Features

- **🔗 Short links** — paste a long URL and get a short, readable link (`shurtle.app/x7Kp2q`). Links without `https://` are fixed up for you.
- **🎯 Custom slugs** — choose your own slug, or claim a free one straight from the 404 page.
- **⏳ Expiring links** — optionally expire a link at the end of a chosen day; expired links stop resolving and are cleaned up weekly.
- **📈 Click stats** — per-link click counts, last-click time and a 30-day clicks chart on your dashboard.
- **🔎 Dashboard** — search, paginate, copy and delete your links.
- **🛡️ Abuse protection** — rate limiting on opening and creating links.
- **🌙 Dark mode** — light, dark and system themes.
- **🔐 Authentication** — sign-in powered by Clerk.

## 🧠 How it works

- **Redirects happen in the proxy.** `src/proxy.ts` (formerly "middleware") recognises single-segment paths like `/abc123`, rate-limits by IP, looks up the destination and responds with a `307` redirect before any page renders. The visit is recorded in the background with `waitUntil`, so it never slows the redirect down. Unknown slugs render the 404 page (status 404) and offer to claim the slug.
- **The dashboard streams.** With Cache Components (partial prerendering) the page shell is static, while the user's stats, chart and links stream in behind Suspense boundaries. Per-user data is cached with `"use cache"` and invalidated instantly after you create or delete a link (`updateTag`).
- **Auth is checked where data is read.** Every Server Component and Server Function that touches user data calls `requireUserId()` (`src/lib/auth.ts`), rather than relying on path matching in the proxy.
- **One set of slug rules.** `src/lib/slugs.ts` defines the slug format and reserved paths, and is shared by validation, the proxy and the UI.

## 🚀 Tech stack

| Area | Tech |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Cache Components, React Compiler, Turbopack) |
| UI | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) on [Radix UI](https://www.radix-ui.com/), [Lucide](https://lucide.dev/) icons |
| Data | [Neon Postgres](https://neon.tech/) with [Drizzle ORM](https://orm.drizzle.team/) |
| Rate limiting | [Upstash Redis](https://upstash.com/) + `@upstash/ratelimit` |
| Auth | [Clerk](https://clerk.com/) |
| Validation | [Zod 4](https://zod.dev/) |
| Hosting | [Vercel](https://vercel.com/) (Cron for cleanup, Analytics, Speed Insights) |

### 💰 Free tier notice

The live demo runs on the free tiers of Vercel, Neon, Upstash and Clerk, so it may have usage limits or occasional downtime.

## 🏃 Running locally

### Prerequisites

- Node.js 22 or newer (24 LTS recommended)
- pnpm (`corepack enable` picks up the version pinned in `package.json`)
- A Postgres database ([Neon](https://neon.tech/) or via the Vercel dashboard)
- An [Upstash](https://upstash.com/) Redis database
- A [Clerk](https://clerk.com/) application

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/danihengeveld/shurtle-ts.git
   cd shurtle-ts
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables** in a `.env.local` file in the project root:

   ```env
   # Database (Neon Postgres)
   POSTGRES_URL="postgres://..."

   # Rate limiting (Upstash Redis)
   KV_REST_API_URL="https://...upstash.io"
   KV_REST_API_TOKEN="..."

   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
   CLERK_SECRET_KEY="sk_..."

   # Protects the weekly cleanup cron endpoint (any long random string)
   CRON_SECRET="..."

   # Optional: public origin used for short links and metadata.
   # Defaults to http://localhost:3000 in development and https://shurtle.app otherwise.
   # NEXT_PUBLIC_SITE_URL="https://your-domain.example"

   # Optional: log every SQL query in development
   # DEBUG_SQL="1"
   ```

4. **Create the database schema**

   ```bash
   pnpm db:push
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

   Then open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / serve it |
| `pnpm lint` | ESLint (Next.js core web vitals + TypeScript rules) |
| `pnpm typecheck` | TypeScript type check |
| `pnpm db:push` | Push the Drizzle schema to the database |
| `pnpm db:studio` | Open Drizzle Studio |

### Deploying

Deploy to Vercel with the environment variables above. `vercel.json` schedules `/api/cron/cleanup` weekly to delete expired links; Vercel sends `CRON_SECRET` automatically as a bearer token.

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss larger changes. CI runs lint, type checking and a production build on every pull request.

## 📝 License

Open source under the [MIT License](LICENSE).

## 👤 Author

**Dani Hengeveld**

- Website: [dani.hengeveld.dev](https://dani.hengeveld.dev)
- GitHub: [@danihengeveld](https://github.com/danihengeveld)
