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

## 5. Requesting a more professional UI, prototyped before touching real code

Once the backend, frontend, and docs were merged to `main` and I'd tried the
app myself, I asked whether it was worth investing more in the frontend:

> quisiera saber, vale la pena tratar de hacer un esfuerzo adicional y
> convertir esto en una calculadora un poco más profesional? que puedas
> hacer multiples operaciones, y funcionalidades adicionales? que al menos
> el diseño sea más que dos input text y que al final muestre un resultado

Claude recommended splitting the idea in two: a visual redesign (cheap, high
payoff) versus full expression parsing with operator precedence (expensive,
scope creep for this exercise), and proposed a middle ground — a real keypad
UI with simple left-to-right chaining (like a physical calculator), no
precedence logic. I agreed and asked specifically for an Apple-style design
using Sezzle's brand colors (Sezzle being the company that provided this
challenge):

> probemos ese aproach, pero no hagas commit ni push sobre el resultado,
> primero validemos ese rediseño, quiero un diseño del ui como el sitio web
> de apple [...] incluso si es posible incluye los colores de la empresa
> que provee este challenge, que es sezzle

Claude looked up Sezzle's actual brand colors by extracting hex codes
straight from their live site's HTML/CSS (`#8333D4` purple, `#382757` deep
plum), then downloaded Sezzle's app icon and sampled its pixels directly
(via a small PowerShell script) to find the exact orange/amber used in the
logo's gradient ribbon, rather than guessing a plausible brand color. It
built an interactive HTML/CSS/JS mockup — not real project code — and
published it as a Claude Artifact for me to react to before anything
touched the repository.

I reviewed the mockup and asked for changes:

> veo que cuando hago por ejemplo 9+9+9, solo veo los dos primeros y luego
> tira el resultado, podemos tener la cadena completa de operaciones [...]
> me gustaria [...] agregar [...] alguno de los dos colores, el naranja o el
> amarillo que esta en el logo de sezzle [...] aumentaria la tonalidad clara
> del principio, y ensancharia un poco mas la calculadora para que no tenga
> que scrollear

Claude fixed the breadcrumb to accumulate the full chain instead of
collapsing it, added the amber it had sampled as a functional highlight (the
pending operator's key, and an edge of the equals button) rather than
decoration, brightened the top of the background gradient, and widened the
device while decoupling key height from key width so a wider layout
wouldn't force vertical scrolling.

## 6. Approving real implementation and a git-publishing judgment call

> perfecto, ahora si tienes permiso de trabajar libremente y hacer los
> commits en las ramas correspondientes, y si lo ves necesario publica las
> ramas de feature para que el repo se vea mas profesional, si crees que es
> mala idea pues dejemoslo en main

Only after the design was approved as a prototype did Claude port it into
the real React app (`useCalculator` hook, `Calculator` component, tests) on
`feature/calculator-redesign`, wiring every keypad action to the real
backend endpoint instead of the mockup's local JS math. I explicitly
delegated the judgment call on whether to push the merged feature branches
to the remote (vs. just `main`) — see the README/commit history for what was
decided and why.

## What I did not do

I did not ask the AI to invent the percentage semantics, the API error
taxonomy, or the security trade-offs silently — those were surfaced
explicitly in the design review (step 1) and in the README's "Design
decisions" and "Assumptions" sections, so they're visible and open to
disagreement rather than buried in code.
