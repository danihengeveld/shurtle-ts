# 🐢 Shurtle

A modern, lightning-fast URL shortener built with Next.js 16 and the latest web technologies. Shurtle makes it easy to create, manage, and track your shortened URLs with a beautiful, responsive interface.

## ✨ Features

### Core Functionality

- **🔗 URL Shortening** - Transform long URLs into short, memorable links
- **🎯 Custom Slugs** - Create personalized short URLs with custom slugs (optional)
- **🗂️ Dashboard** - Manage all your shortened URLs in one place

### Advanced Features

- **⚡ Rate Limiting** - Smart rate limiting to prevent abuse and protect your credit card
- **🌙 Dark Mode** - Beautiful dark/light theme support
- **🔐 Authentication** - Secure user authentication with Clerk
- **📄 Pagination** - Pagination for large collections of shurtles
- **🗑️ Management** - Delete unwanted shurtles

## 🎯 Why Shurtle is Cool

### Performance First

- **⚡ Partial Prerendering** - Static shell with dynamic content streaming
- **🚀 Server Components** - Optimal balance of performance and security
- **📦 Optimized Bundles** - Minimal JavaScript for lightning-fast loads
- **🎯 Smart Caching** - Intelligent caching strategies for better UX

### User Experience

- **🎯 Intuitive Interface** - Clean, modern design that's easy to use, thanks to @shadcn
- **⚡ Fast Interactions** - Optimistic updates and smooth transitions
- **🌙 Theme Support** - Beautiful dark and light modes

### Developer Experience

- **🛠️ TypeScript** - Type-safe code for better maintainability
- **📦 Drizzle ORM** - Type-safe database interactions

## 🚀 Tech Stack

### Frontend

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router and Partial Prerendering
- **[React 19](https://react.dev/)** - Latest React with Server Components and Suspense
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible UI components
- **[Lucide React](https://lucide.dev/)** - Modern icon library

### Backend & Database

- **[Neon Postgres (via Vercel)](https://neon.tech/)** - Serverless Postgres database for storing shurtles
- **[Upstash Redis (via Vercel)](https://upstash.com/)** - Serverless Redis for caching and rate limiting
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database toolkit
- **[Clerk](https://clerk.com/)** - Complete authentication solution

### Development & Deployment

- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vercel](https://vercel.com/)** - Deployment and hosting platform

## 🌐 Live Demo

Check out the live version of Shurtle: **[shurtle.app](https://shurtle.app)**

### 💰 Free Tier Notice

This project is currently deployed using free tiers of various services:

- **Vercel** - Free hosting and deployment
- **Neon Postgres** - Free database tier (limited storage and requests)
- **Upstash Redis** - Free Redis tier (limited storage and requests)
- **Clerk** - Free authentication tier (limited monthly active users)

This means the live demo may have usage limitations or occasional downtime.

## 🏃‍♂️ Running Locally

### Prerequisites

- Node.js 22.x (LTS)
- pnpm
- A Vercel account (for databases) or Neon and Upstash accounts
- A Clerk account (for authentication)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/danihengeveld/shurtle-ts.git
   cd shurtle
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Database (Neon Postgres)
   POSTGRES_URL="your-postgres-url"

   # Redis (Upstash)
   KV_REST_API_URL="your-upstash-redis-url"
   KV_REST_API_TOKEN="your-upstash-redis-token"

   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
   CLERK_SECRET_KEY="your-clerk-secret-key"
   ```

4. **Set up the database**

   ```bash
   # Push the database schema
   pnpm exec drizzle-kit push
   ```

5. **Run the development server**

   ```bash
   pnpm dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see Shurtle in action!

### Database Setup

1. Create a new Postgres database via your Vercel dashboard or on [Neon](https://neon.tech/).
2. Copy the connection strings to your `.env.local` file.
3. Run `npx drizzle-kit push:pg` to set up the schema.

### Redis Setup

1. Create a new Redis instance via your Vercel dashboard on [Upstash](https://upstash.com/).
2. Copy the REST API URL and token to your `.env.local` file.

### Authentication Setup

1. Create a new application on [Clerk](https://clerk.com/).
2. Copy your publishable and secret keys to your `.env.local` file.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using Next.js 16, React 19.2, and modern web technologies.
