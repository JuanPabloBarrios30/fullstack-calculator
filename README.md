# Fullstack Calculator

A full-stack calculator built as a technical exercise: a Go REST API for the
arithmetic, and a React + TypeScript frontend that consumes it. The goal was
clean separation of concerns, solid error handling, and tests that actually
exercise the behavior — not extra features.

## Tech stack

- **Backend:** Go (standard library only — `net/http`, no framework)
- **Frontend:** React + TypeScript (Vite)
- **Tests:** Go's built-in testing package (backend), Vitest + React Testing
  Library (frontend)

## Project structure

```
fullstack-calculator/
  backend/
    cmd/api/            entry point, server wiring (timeouts, middleware)
    internal/calculator/ pure arithmetic domain logic (no HTTP knowledge)
    internal/httpapi/    HTTP handlers, middleware, request/response DTOs
  frontend/
    src/
      types/            shared Operation type and API contracts
      api/               typed fetch client
      utils/             client-side validation
      components/        CalculatorForm
      App.tsx            state orchestration (idle/loading/success/error)
```

## Supported operations

Addition, subtraction, multiplication, division, power, square root, and
percentage. Square root is the only unary operation (it only needs `a`); all
others require both `a` and `b`.

## Setup & running

### Prerequisites

- Go 1.22+ (developed against 1.26)
- Node 20+ (developed against 24)

### Backend

```bash
cd backend
go run ./cmd/api
```

Starts on `:8080` by default. Configurable via environment variables:

| Variable         | Default                   | Purpose                                   |
|------------------|----------------------------|--------------------------------------------|
| `PORT`           | `8080`                     | Port the server listens on                 |
| `ALLOWED_ORIGIN` | `http://localhost:5173`    | Origin allowed by CORS (the frontend's dev server) |

Run the tests (with coverage):

```bash
cd backend
go test ./... -cover
# HTML coverage report:
go test ./... -coverprofile=coverage.out && go tool cover -html=coverage.out -o coverage.html
```

Current coverage: **100%** on `internal/calculator`, **~98%** on
`internal/httpapi`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # defaults to http://localhost:8080, adjust if needed
npm run dev
```

Opens on `http://localhost:5173` (Vite's default).

Run the tests:

```bash
cd frontend
npm test              # single run
npm run test:coverage # with coverage report (text + HTML in coverage/)
```

Build for production:

```bash
npm run build
```

## API usage

### `POST /api/v1/calculate`

Request body:

```json
{ "operation": "add", "a": 10, "b": 4 }
```

`operation` is one of: `add`, `subtract`, `multiply`, `divide`, `power`,
`sqrt`, `percentage`. `b` is omitted for `sqrt`.

**Examples:**

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"add","a":10,"b":4}'
# {"result":14}

curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"sqrt","a":81}'
# {"result":9}

curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"percentage","a":10,"b":200}'
# {"result":20}   -> "10 percent of 200"

curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"divide","a":10,"b":0}'
# HTTP 422 {"error":"division by zero"}

curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"modulo","a":1,"b":2}'
# HTTP 400 {"error":"unsupported operation \"modulo\""}
```

**Status codes:**

| Status | Meaning                                                             |
|--------|----------------------------------------------------------------------|
| 200    | Success                                                               |
| 400    | Malformed JSON, unknown fields, unsupported operation, missing operand |
| 422    | Well-formed request, but the operation is undefined for the given operands (division by zero, negative square root, overflow to infinity) |

### `GET /health`

Returns `{"status":"ok"}`. Used as a liveness check (and for Docker
healthchecks).

## Design decisions

- **Domain logic is transport-agnostic.** `internal/calculator` has no
  knowledge of HTTP or JSON — it's pure functions over `float64`, which makes
  it trivial to unit test and would let it be reused (e.g. behind a CLI or a
  different API) without changes.

- **One endpoint, not one per operation.** `POST /api/v1/calculate` takes an
  `operation` field rather than exposing `/add`, `/subtract`, etc. Adding a
  new operation later means changing the domain package and one switch
  statement, not adding routes.

- **`a`/`b` are pointers in the request DTO** so the handler can tell "field
  omitted" apart from "field sent as `0`" — this is what makes it possible to
  give a precise error like `field "b" is required for operation "add"`
  instead of silently treating a missing `b` as zero.

- **Errors are domain-first.** The `calculator` package returns sentinel
  errors (`ErrDivisionByZero`, `ErrNegativeSqrt`, etc.); the HTTP layer maps
  them to status codes via `errors.Is`. This keeps the mapping decision in one
  place and keeps the domain package free of HTTP concepts.

- **No third-party router.** Go 1.22+'s `net/http.ServeMux` already supports
  method-based routing (`"POST /api/v1/calculate"`), which is all this
  project needs — pulling in a router adds a dependency without adding
  capability here.

- **Security basics that cost little, skip the ones that don't fit the
  scope.** Included: explicit `ReadTimeout`/`WriteTimeout`/`IdleTimeout` on
  `http.Server`, a request body size cap (`http.MaxBytesReader`), panic
  recovery middleware, and a CORS policy that allows a single named origin
  rather than `*`. Deliberately **not** included: authentication, rate
  limiting, HTTPS/TLS termination — this is a stateless calculator with no
  user data, so those would be scope creep for what's being evaluated here.

- **Client-side validation is a convenience, not the source of truth.** The
  frontend mirrors a subset of the backend's rules (missing operands, divide
  by zero, negative sqrt) so the user gets instant feedback, but every
  request is still validated server-side regardless of what the client sent.

- **Non-finite results are rejected before they reach JSON.** Go's
  `encoding/json` cannot marshal `NaN`/`Inf`, so an extreme `power` call
  (e.g. `10 ^ 400`) is checked after computing and turned into a proper 422
  instead of a broken response body.

## Assumptions

- **Percentage is defined as "`a` percent of `b`"**: `percentage(10, 200) = 20`.
  This wasn't specified in the prompt, so it's called out explicitly here.
- Numbers are IEEE-754 `float64` on both ends — no arbitrary-precision
  arithmetic, since the brief didn't call for it and it would add complexity
  disproportionate to a calculator exercise.
- The API assumes a single trusted frontend origin in development
  (`http://localhost:5173`); there's no multi-tenant or public-CORS use case
  here.

## AI tooling

This project was built with Claude Code. See [PROMPTS.md](PROMPTS.md) for the
prompts used during development.
