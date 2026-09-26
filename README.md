# JobMate

JobMate is a modern, high-performance AI-powered career assistant and resume optimization platform. Built with TanStack Start, React 19, TypeScript, and Tailwind CSS.

## Features

- **AI Resume Builder & Optimizer**: Tailor resumes and cover letters for target job postings with high ATS pass rates.
- **Telegram Bot Integration**: Instant job matching and resume feedback on mobile via JobMate Bot.
- **Modern Landing Page**: Pixel-perfect responsive interface featuring glassmorphic components, accessible UI elements, and sleek styling.
- **Fast SSR & Client Routing**: Powered by TanStack Start and TanStack Router with seamless page transitions.

## Tech Stack

- **Framework**: TanStack Start (React 19)
- **Routing**: TanStack Router with file-based routing
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS v4, Lucide Icons, Radix UI primitives
- **Bundler & Tooling**: Vite, TypeScript, ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Build & Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── public/                 # Static assets & favicons
├── src/
│   ├── components/         # Reusable UI components & landing sections
│   │   ├── landing/        # Marketing & landing page components
│   │   └── ui/             # Radix UI + Tailwind design system components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility helpers & error reporting
│   ├── routes/             # File-based routes (TanStack Start)
│   │   ├── __root.tsx      # Root layout & app shell
│   │   ├── index.tsx       # Landing page route
│   │   ├── dashboard.tsx   # Dashboard route
│   │   └── templates.tsx   # Templates route
│   ├── server.ts           # Server entry point
│   └── styles.css          # Core CSS tokens & Tailwind theme definitions
└── vite.config.ts          # Vite configuration
```
