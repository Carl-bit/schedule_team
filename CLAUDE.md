# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Schedule Team — a team scheduling and time-tracking system (Spanish-language UI). Two roles: **Líder** (manager) and **Trabajador** (worker). Built as a monorepo with separate frontend and backend.


## OUTPUT RULES
 
- Answer line 1. No preamble.
- No "Sure!", "Great!", "Of course!", "Absolutely!", "Certainly!".
- No hollow closings. No "Hope this helps!", "Let me know!".
- No restating the prompt. Task is clear -> execute.
- No explaining what you're about to do. Just do it.
- No unsolicited suggestions. Exact scope only.
- Structured output: bullets, tables, code blocks. Prose only if explicitly asked.
## TOKEN EFFICIENCY
 
- Every sentence earns its place.
- No redundant context. Don't repeat what's already in session.
- No long intros or section transitions.
- Short = correct. Depth only if asked.
## CODE OUTPUT
 
- Simplest working solution. No over-engineering.
- No abstractions for single-use ops.
- No speculative features or future-proofing.
- No docstrings/comments on unchanged code.
- Inline comments only where logic is non-obvious.
- Read file before modifying. Never edit blind.
- No new files unless strictly necessary.
## SCOPE CONTROL
 
- Don't add features beyond what was asked.
- Don't refactor surrounding code when fixing a bug.
- Don't touch files outside the request.
## SYCOPHANCY - ZERO TOLERANCE
 
- Never validate before answering.
- Never say "You're absolutely right!" unless it's verifiably true.
- Disagree when wrong. State correction directly.
- Don't change a correct answer because user pushes back.
## HALLUCINATION PREVENTION
 
- Never speculate about code/files/APIs not read.
- Reference a file? Read it first, then answer.
- Unsure? Say "I don't know." Never guess confidently.
- Never invent paths, function names, or API signatures.
- User corrects a factual claim -> accept as session ground truth.
## TYPOGRAPHY - ASCII ONLY
 
- No em dashes (--) -> use hyphens (-)
- No smart/curly quotes -> use straight quotes
- No ellipsis char -> use three dots (...)
- No Unicode bullets -> use hyphens (-) or asterisks (*)
## WARNINGS & DISCLAIMERS
 
- No safety disclaimers unless genuine life/legal risk.
- No "Note that...", "Keep in mind...", "Worth mentioning...".
- No "As an AI..." framing.
## SESSION MEMORY
 
- Learn corrections and preferences within session.
- Apply silently. Don't re-announce learned behavior.
- Mistake corrected -> fix, remember, move on.
---


## Commands

```bash
# Full-stack dev (runs both front + API concurrently)
npm run dev

# Frontend only (Next.js on port 3001)
cd front && npm run dev

# Backend only (Express on port 3000, with nodemon)
cd API && npm run dev

# Lint frontend
cd front && npm run lint

# Docker full stack (DB + pgAdmin + API + Frontend)
docker compose up --build
```

No test suite is configured.

## Architecture

**Monorepo with three top-level directories:**

- `front/` — Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- `API/` — Express 5 REST API, plain JavaScript, raw SQL via `pg` pool
- `BACK/` — PostgreSQL 16 schema (`init.sql`), seed data (`seeds.sql`), triggers (`trigger.sql`)

### Request flow

```
Next.js page → fetch(/api/...) → next.config.ts rewrite → Express route → controller → service (SQL) → PostgreSQL
```

### Backend layering (API/)

Routes (`routes/`) → Controllers (`controllers/`) → Services (`services/`) → `config/db.js` (pg.Pool)

- No ORM — all queries are raw SQL
- UUIDs generated with `crypto.randomUUID()`
- Passwords hashed with bcrypt (10 rounds)
- No JWT — auth uses HTTP-only `user_role` cookie

### Frontend patterns (front/)

- All dashboard pages are `"use client"` with `useState`/`useEffect`
- `middleware.ts` reads `user_role` cookie to route `/dashboard` → Líder or Trabajador
- Two dashboard trees: `app/dashboard/Lider/` and `app/dashboard/Trabajador/`
- Animated backgrounds use Three.js (`@react-three/fiber`) and Canvas
- PDF reports generated client-side with jspdf

### Database (BACK/)

10 tables: 5 catalog tables (`catalogo_*`), `empleados`, `proyectos`, `asignaciones`, `planificacion_horaria`, `registro_horas`, `ausencias`, `solicitudes_cobertura`. String UUIDs as PKs.

## Environment Setup

Copy `.env.example` files in both `API/` and `front/`. Key variables:

- **API**: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT`, `CORS_ORIGIN`
- **Front**: `NEXT_PUBLIC_API_URL` (default `http://localhost:3000/api`)

Docker overrides these via `docker-compose.yml` (DB hostname becomes `db`, API becomes `api`).

## Conventions

- Codebase language is **Spanish** (variable names, comments, UI text)
- Backend controllers return PostgreSQL error codes (23505 = unique violation, 23503 = FK violation)
- Role detection: `puesto_empleado_id === 'PUESTO_JEFE'` means leader
- Frontend styling mixes Tailwind utility classes with CSS Modules (`dashboard.module.css`)
