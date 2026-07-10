// Package httpapi wires the calculator domain logic to HTTP: routing,
// request validation, and translating domain errors into status codes.
package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/JuanPabloBarrios30/fullstack-calculator/backend/internal/calculator"
)

// maxRequestBodyBytes caps the size of an incoming request body. A
// calculator payload is tiny, so this is generous while still preventing a
// client from streaming an unbounded body at the server.
const maxRequestBodyBytes = 1 << 20 // 1 MiB

// Handler holds the dependencies needed by the HTTP handlers.
type Handler struct {
	logger *log.Logger
}

// NewHandler builds a Handler that logs through the given logger.
func NewHandler(logger *log.Logger) *Handler {
	return &Handler{logger: logger}
}

// Routes registers all endpoints and returns the resulting http.Handler.
func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", h.handleHealth)
	mux.HandleFunc("POST /api/v1/calculate", h.handleCalculate)
	return mux
}

func (h *Handler) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleCalculate(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)

	var req CalculateRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "request body must be a valid JSON object with \"operation\", \"a\" and optionally \"b\"")
		return
	}

	op := calculator.Operation(strings.ToLower(strings.TrimSpace(req.Operation)))
	if !calculator.IsValidOperation(op) {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("unsupported operation %q", req.Operation))
		return
	}

	if req.A == nil {
		writeError(w, http.StatusBadRequest, `field "a" is required`)
		return
	}

	if calculator.RequiresSecondOperand(op) && req.B == nil {
		writeError(w, http.StatusBadRequest, fmt.Sprintf(`field "b" is required for operation %q`, op))
		return
	}

	var b float64
	if req.B != nil {
		b = *req.B
	}

	result, err := calculator.Calculate(op, *req.A, b)
	if err != nil {
		writeError(w, statusForCalculationError(err), err.Error())
		return
	}

	writeJSON(w, http.StatusOK, CalculateResponse{Result: result})
}

// statusForCalculationError maps a domain error from the calculator package
// to the HTTP status code that best describes it.
func statusForCalculationError(err error) int {
	if errors.Is(err, calculator.ErrUnsupportedOperation) {
		return http.StatusBadRequest
	}
	// Division by zero, negative sqrt, and non-finite results are all cases
	// where the request was well-formed but the operation is undefined for
	// the given operands - a 422 fits better than a generic 400.
	return http.StatusUnprocessableEntity
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, ErrorResponse{Error: message})
}
