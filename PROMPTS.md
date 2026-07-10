# Prompts Used in This Project

This project was built with [Claude Code](https://claude.com/claude-code)
(model: Claude Sonnet 5). Below are the prompts that shaped the
architecture, implementation, and design of the project, in the order they
were used, along with a brief note on what came out of each one.

## 1. Architecture and design review

> I'm building a full-stack calculator (Go backend, React/TypeScript
> frontend) for a technical assessment. I have a draft plan for the project
> structure, branch strategy, and implementation order — review it against
> software engineering best practices, with particular attention to
> security. This is a timed technical exercise rather than a production
> system, so scope your recommendations accordingly. Give me your analysis
> before we start implementing.

Claude proposed a single `POST /api/v1/calculate` endpoint instead of one
route per operation, typed domain errors mapped to HTTP status codes,
explicit handling of `NaN`/`Inf` results, backend timeouts and body-size
limits, an explicit CORS policy, and a list of things intentionally left out
of scope (authentication, rate limiting, a database) given the nature of the
exercise.

## 2. Workflow approval

> Proceed with that plan. Use a feature-branch workflow — one branch per
> component — and handle the commits yourself; check in with me before
> merging into main.

## 3. Implementation

Claude implemented the backend (calculator domain logic, HTTP handlers,
middleware, unit tests), then the frontend (typed API client, form,
component tests), then the initial documentation — each on its own branch,
merged into `main` after tests and a manual smoke test passed. This part
wasn't driven by a prompt per file: the direction was set in steps 1–2, and
Claude self-verified against it.

## 4. Requesting a more polished frontend

> Now that the backend and frontend work end-to-end, I want to raise the bar
> on the UI. Support chained operations the way a real calculator does,
> instead of a single form submission, and move away from a bare two-input
> form toward something that feels like a finished product.

Claude proposed scoping this to a keypad UI with simple left-to-right
chaining (like a physical calculator), explicitly ruling out full
expression parsing with operator precedence as unnecessary scope for this
exercise. I approved that scope.

## 5. Design direction

> For the visual direction, I want something inspired by Apple's product
> pages — minimal, generous whitespace, refined typography, and a
> deliberate color palette. Prototype it as a standalone mockup first so I
> can review it before it touches the real codebase.

Claude built an interactive HTML/CSS/JS mockup and published it separately
for review, before writing any application code.

## 6. Design feedback

> A few changes: keep the full chain of operations visible as they're
> entered, instead of collapsing down to just the last step. Introduce a
> secondary accent color used deliberately, not just decoratively.
> Brighten the top of the background gradient, and widen the calculator so
> it's fully visible without needing to scroll.

Claude implemented all four changes in the mockup and I approved the result
before any of it was implemented for real.

## 7. Approval to implement

> This design is approved — implement it in the real application, committing
> to the appropriate feature branches as you go.

Claude wired the approved design into the real React app, replacing the
mockup's local math with actual calls to the backend, and merged it
following the same branch-per-component workflow used throughout the
project.

## 8. Final documentation review

> Review the README and this prompts document once more before we call this
> done — I want them to read cleanly and professionally, with no loose ends
> or internal process details that don't belong in a submitted deliverable.

Claude replaced an example that read as low-effort and tightened both
documents to their current form.

## What I did not do

I did not ask the AI to invent the percentage semantics, the API error
taxonomy, or the security trade-offs silently — those were surfaced
explicitly during the design review (step 1) and documented in the README's
"Design decisions" and "Assumptions" sections, so they're visible and open to
disagreement rather than buried in code.
