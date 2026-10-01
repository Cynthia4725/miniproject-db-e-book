# ADR 0007: Next.js App Router Architecture with Direct Neon SQL Execution

## Status
Accepted

## Context
Deploying a relational database-backed full-stack web application to Vercel requires minimizing serverless cold starts, preventing database connection exhaustion, and keeping backend database credentials isolated from the browser. At the same time, this academic project mandates demonstrating explicit, auditable SQL statements directly tied to application events rather than hidden behind generic client-side abstraction layers.

## Decision
We adopt **Next.js (App Router)** as the full-stack web application framework paired with **Tailwind CSS**:
1. **Server-Side Data Execution**: React Server Components (RSC) execute read queries directly against PostgreSQL on the server, streaming rendered HTML to the client without exposing database endpoints to the browser.
2. **Server Actions for Mutations**: Form submissions (order placement, slip upload, admin verification) execute via Next.js Server Actions, running direct parameterized SQL inside atomic database transactions.
3. **HTTP-based Neon Driver**: Direct queries use `@neondatabase/serverless` HTTP driver (`sql` tagged template literals), ensuring zero connection pool leakage across Vercel serverless executions.
4. **Self-Contained Session Authentication**: Authentication utilizes encrypted HTTP-only session cookies with a built-in demo role switcher, eliminating third-party OAuth setup barriers during academic evaluation.

## Considered Options
- **Pages Router with REST API Layer**: Rejected due to redundant API boilerplate and client-side credential exposure risks.
- **Third-Party OAuth (Google/GitHub NextAuth)**: Rejected because external OAuth callback configurations create failure risks during offline or foreign IP evaluations by grading faculty.

## Consequences
- **Positive**:
  - Direct, readable SQL queries visible in server components and actions for instructor inspection.
  - Zero connection pool starvation on Vercel serverless edge/lambda infrastructure.
  - Seamless, friction-free role demonstration between customer and administrator personas.
- **Negative**:
  - Tight architectural coupling between Next.js server actions and PostgreSQL queries.
