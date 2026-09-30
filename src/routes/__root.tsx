import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Analytics } from "@vercel/analytics/react";
import appCss from "../styles.css?url";
import { reportAppError } from "../lib/error-reporting";
import { AuthProvider } from "../hooks/use-auth";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const jobMateStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://jobmate-ebon.vercel.app/#webapp",
      "name": "JobMate AI",
      "url": "https://jobmate-ebon.vercel.app",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "description": "Multi-Agent ATS Resume Engineering, Overleaf pdflatex compilation, and Job Application Copilot.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "featureList": [
        "Multi-Agent LangGraph Resume Pipeline",
        "Deterministic Single-Column LaTeX pdflatex Generation",
        "Live Canvas AI Copilot with Tool-Calling",
        "GitHub Repository Architecture Analysis",
        "Multi-Persona Resume Branching",
        "1-Click Job URL Scraper & ATS Gap Radar",
      ],
      "author": {
        "@type": "Organization",
        "name": "JobMate AI",
        "url": "https://jobmate-ebon.vercel.app",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://jobmate-ebon.vercel.app/#organization",
      "name": "JobMate AI",
      "url": "https://jobmate-ebon.vercel.app",
      "logo": "https://jobmate-ebon.vercel.app/jobmate-logo.png",
      "founder": {
        "@type": "Person",
        "name": "Sumit Raikwar",
        "url": "https://github.com/SumitRaikwar18",
      },
      "sameAs": ["https://github.com/SumitRaikwar18/JobMate"],
    },
    {
      "@type": "FAQPage",
      "@id": "https://jobmate-ebon.vercel.app/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does JobMate achieve a 99% ATS parse rate?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "JobMate uses strict single-column layout architecture, glyphtounicode mapping, and deterministic LaTeX compilation that prevents parsing truncation across Workday, Greenhouse, Lever, Taleo, and iCIMS.",
          },
        },
        {
          "@type": "Question",
          "name": "Is JobMate LaTeX code compatible with Overleaf?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, 100%. JobMate generates clean pdflatex-compatible LaTeX markup that can be copied directly into Overleaf or downloaded as a .tex file.",
          },
        },
        {
          "@type": "Question",
          "name": "What is the Multi-Agent Resume Tailoring Pipeline?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "JobMate uses autonomous specialized agents (JD Analyzer, Evidence Graph Matcher, Google XYZ Impact Formulator, and ATS Compliance Verifier) to synthesize job requirements with candidate facts without hallucinating false claims.",
          },
        },
      ],
    },
  ],
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { title: "JobMate AI — Autonomous Multi-Agent ATS Resume Engineering & LaTeX Platform" },
      { name: "description", content: "Turn real engineering experience into 99%+ ATS-proof single-column resumes. Powered by Multi-Agent LangGraph StateGraph, Evidence RAG, Google XYZ framework, and Overleaf pdflatex compiler." },
      { name: "keywords", content: "ATS resume builder, AI resume tailoring, LaTeX resume, Overleaf resume, Job application tracker, LangGraph, Career Copilot, ATS score checker, Google XYZ resume, Generative Engine Optimization, AEO job search" },
      { name: "author", content: "Sumit Raikwar, JobMate AI Team" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "googlebot", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { name: "bingbot", content: "index, follow, max-snippet:-1, max-image-preview:large" },
      
      // GEO Meta Tags (Generative Engine Optimization & Regional indexing)
      { name: "geo.region", content: "US-CA, IN-KA, GLOBAL" },
      { name: "geo.placename", content: "San Francisco, Bengaluru, Remote Worldwide" },
      { name: "geo.position", content: "37.7749;-122.4194" },
      { name: "ICBM", content: "37.7749, -122.4194" },
      { name: "distribution", content: "global" },
      { name: "rating", content: "general" },
      { name: "target", content: "all" },
      { name: "theme-color", content: "#4f46e5" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "JobMate AI" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },

      // OpenGraph Protocol
      { property: "og:site_name", content: "JobMate AI" },
      { property: "og:locale", content: "en_US" },
      { property: "og:title", content: "JobMate AI — Autonomous Multi-Agent ATS Resume Engineering & LaTeX Platform" },
      { property: "og:description", content: "Turn real engineering experience into 99%+ ATS-proof single-column resumes with Multi-Agent AI and deterministic Overleaf pdflatex compilation." },
      { property: "og:url", content: "https://jobmate-ebon.vercel.app" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://jobmate-ebon.vercel.app/jobmate-banner.png" },
      { property: "og:image:secure_url", content: "https://jobmate-ebon.vercel.app/jobmate-banner.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "JobMate AI Multi-Agent Resume Engineering & LaTeX Compiler" },

      // Twitter Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@JobMateAI" },
      { name: "twitter:creator", content: "@SumitRaikwar18" },
      { name: "twitter:title", content: "JobMate AI — Autonomous Multi-Agent ATS Resume Engineering & LaTeX Platform" },
      { name: "twitter:description", content: "Turn your real candidate experience into 99%+ ATS-proof single-column resumes with Multi-Agent AI and deterministic LaTeX." },
      { name: "twitter:image", content: "https://jobmate-ebon.vercel.app/jobmate-banner.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "canonical", href: "https://jobmate-ebon.vercel.app" },
      { rel: "alternate", href: "https://jobmate-ebon.vercel.app/llms.txt", type: "text/plain", title: "LLMs Index" },
      { rel: "icon", href: "/jobmate-logo.png", type: "image/png" },
      { rel: "shortcut icon", href: "/jobmate-logo.png" },
      { rel: "apple-touch-icon", href: "/jobmate-logo.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jobMateStructuredData),
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-right" richColors />
        <Analytics />
      </AuthProvider>
    </QueryClientProvider>
  );
}
