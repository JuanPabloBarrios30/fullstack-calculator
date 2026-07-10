package httpapi

// CalculateRequest is the expected JSON body for POST /api/v1/calculate.
//
// A and B are pointers so the handler can distinguish "field omitted" from
// "field sent as 0", which matters for validating that unary operations
// (like sqrt) don't silently accept a missing operand.
type CalculateRequest struct {
	Operation string   `json:"operation"`
	A         *float64 `json:"a"`
	B         *float64 `json:"b,omitempty"`
}

// CalculateResponse is returned on a successful calculation.
type CalculateResponse struct {
	Result float64 `json:"result"`
}

// ErrorResponse is returned whenever a request cannot be fulfilled.
type ErrorResponse struct {
	Error string `json:"error"`
}
