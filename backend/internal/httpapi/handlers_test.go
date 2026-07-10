package httpapi

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newTestHandler() http.Handler {
	logger := log.New(io.Discard, "", 0)
	return NewHandler(logger).Routes()
}

func doRequest(t *testing.T, handler http.Handler, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	return rec
}

func TestHandleHealth(t *testing.T) {
	t.Parallel()

	handler := newTestHandler()
	rec := doRequest(t, handler, http.MethodGet, "/health", "")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestHandleCalculate_Success(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		body       string
		wantResult float64
	}{
		{"addition", `{"operation":"add","a":2,"b":3}`, 5},
		{"division", `{"operation":"divide","a":10,"b":4}`, 2.5},
		{"unary sqrt without b", `{"operation":"sqrt","a":9}`, 3},
		{"operation is case-insensitive", `{"operation":"ADD","a":1,"b":1}`, 2},
	}

	handler := newTestHandler()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			rec := doRequest(t, handler, http.MethodPost, "/api/v1/calculate", tt.body)
			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d, body = %s", rec.Code, http.StatusOK, rec.Body.String())
			}

			var resp CalculateResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
			if resp.Result != tt.wantResult {
				t.Errorf("result = %v, want %v", resp.Result, tt.wantResult)
			}
		})
	}
}

func TestHandleCalculate_ValidationErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		body       string
		wantStatus int
	}{
		{"malformed JSON", `{"operation":`, http.StatusBadRequest},
		{"unknown field", `{"operation":"add","a":1,"b":2,"c":3}`, http.StatusBadRequest},
		{"unsupported operation", `{"operation":"modulo","a":1,"b":2}`, http.StatusBadRequest},
		{"missing operand a", `{"operation":"add","b":2}`, http.StatusBadRequest},
		{"missing operand b for binary op", `{"operation":"add","a":1}`, http.StatusBadRequest},
		{"division by zero", `{"operation":"divide","a":1,"b":0}`, http.StatusUnprocessableEntity},
		{"negative sqrt", `{"operation":"sqrt","a":-4}`, http.StatusUnprocessableEntity},
	}

	handler := newTestHandler()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			rec := doRequest(t, handler, http.MethodPost, "/api/v1/calculate", tt.body)
			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d, body = %s", rec.Code, tt.wantStatus, rec.Body.String())
			}

			var resp ErrorResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
				t.Fatalf("failed to decode error response: %v", err)
			}
			if resp.Error == "" {
				t.Error("expected a non-empty error message")
			}
		})
	}
}

func TestHandleCalculate_RejectsOversizedBody(t *testing.T) {
	t.Parallel()

	handler := newTestHandler()
	oversized := `{"operation":"add","a":1,"b":` + strings.Repeat("9", maxRequestBodyBytes) + `}`

	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewReader([]byte(oversized)))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}
