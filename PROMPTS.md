# AI prompts used in this project

This project was built with [Claude Code](https://claude.com/claude-code)
(model: Claude Sonnet 5). This file lists the actual prompts that drove the
work, in order, condensed for readability but not altered in intent.

## 1. Initial brief and request for a design review

I shared the challenge requirements plus a personal draft plan (project
structure, branch strategy, order of work) and asked for a review before
writing any code:

> hola, quiero trabajar en un reto de una aplicación fullstack con Go y
> React [...] te añadí al contexto un txt en el cual encontraras una
> información que discutí con otro agente para iniciar con el proyecto [...]
> me gustaria que tu me hicieras sugerencias sobre esa propuesta de
> implementación y la arquitectura. quiero que integremos las mejores
> prácticas y patrones de desarrollo de software, y por nada del mundo
> dejemos de lado las buenas prácticas en seguridad [...] tambien es cierto
> que esto es una prueba tecnica [...] entonces acopla mis requerimientos a
> ese scope

Claude reviewed the draft plan and proposed concrete adjustments: a single
`POST /api/v1/calculate` endpoint instead of one route per operation, typed
domain errors mapped to HTTP status codes, handling of `NaN`/`Inf` results
(Go's `encoding/json` can't serialize them), request timeouts/body limits/
panic recovery/explicit CORS on the backend, client-side validation as a UX
convenience only (never as the source of truth), and an explicit list of
things deliberately left out of scope (auth, rate limiting, databases) given
this is a timed technical exercise, not a production system.

## 2. Approval and git workflow

> me gusta tu analisis, procedamos

Followed by a clarifying question from Claude about how to handle git
(branches/commits), since the draft plan called for a branch-per-feature
workflow. I chose to have Claude create branches and commit at each
milestone, and check in before merging to `main`.

## 3. Language correction

> olvide mencionar esto, los archivos y código que generes por favor en
> ingles, con documentacion o comentarios acordes a las buenas prácticas

All code, identifiers, comments, and commit messages were written in English
from that point on (this file and the conversation with Claude remained in
Spanish).

## 4. Implementation (guided, not micromanaged)

From there, Claude worked through the plan largely autonomously per branch:

- `feature/backend-api`: calculator domain logic, HTTP handlers, middleware
  (recovery/CORS/logging), unit tests, then a manual smoke test of the
  running server with `curl` before merging.
- `feature/frontend-ui`: Vite + React + TS scaffold, typed API client, form
  component with client-side validation, Vitest + Testing Library tests, and
  a manual end-to-end check against the running backend (verified via
  `curl` with an `Origin` header, since no browser-automation tool was
  available in this environment) before merging.
- `feature/documentation`: this file and the root `README.md`.

I did not write step-by-step prompts for each file — I reviewed the design
decisions up front, then let Claude implement and self-verify (tests,
builds, manual smoke tests) against that agreed direction, catching anything
that needed correcting along the way.

## What I did not do

I did not ask the AI to invent the percentage semantics, the API error
taxonomy, or the security trade-offs silently — those were surfaced
explicitly in the design review (step 1) and in the README's "Design
decisions" and "Assumptions" sections, so they're visible and open to
disagreement rather than buried in code.
