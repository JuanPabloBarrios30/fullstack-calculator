// Package calculator implements the core arithmetic operations of the
// application. It has no knowledge of HTTP, JSON, or any other transport
// concern, so it can be tested and reused in isolation.
package calculator

import (
	"errors"
	"fmt"
	"math"
)

// Operation identifies a supported arithmetic operation.
type Operation string

const (
	Add        Operation = "add"
	Subtract   Operation = "subtract"
	Multiply   Operation = "multiply"
	Divide     Operation = "divide"
	Power      Operation = "power"
	Sqrt       Operation = "sqrt"
	Percentage Operation = "percentage"
)

// Sentinel errors returned by Calculate. Callers (e.g. the HTTP layer) can
// use errors.Is to map them to the appropriate response without the
// calculator package knowing anything about status codes.
var (
	ErrUnsupportedOperation = errors.New("unsupported operation")
	ErrDivisionByZero       = errors.New("division by zero")
	ErrNegativeSqrt         = errors.New("cannot calculate the square root of a negative number")
	ErrResultNotFinite      = errors.New("result is not a finite number")
)

// binaryOperations are the operations that require both operands (a and b).
// Sqrt is the only unary operation: it only needs "a".
var binaryOperations = map[Operation]bool{
	Add:        true,
	Subtract:   true,
	Multiply:   true,
	Divide:     true,
	Power:      true,
	Percentage: true,
}

// IsValidOperation reports whether op is one of the operations supported by
// this package.
func IsValidOperation(op Operation) bool {
	if op == Sqrt {
		return true
	}
	return binaryOperations[op]
}

// RequiresSecondOperand reports whether op needs a "b" operand in addition
// to "a". Currently only Sqrt is unary.
func RequiresSecondOperand(op Operation) bool {
	return binaryOperations[op]
}

// Calculate performs op on operands a and b and returns the result.
//
// For the unary Sqrt operation, b is ignored; callers should still validate
// that a second operand isn't silently expected by the caller-facing API.
//
// Percentage is defined as "a percent of b", e.g. Calculate(Percentage, 10, 200)
// returns 20 (10% of 200). This convention is documented in the README.
func Calculate(op Operation, a, b float64) (float64, error) {
	var result float64

	switch op {
	case Add:
		result = a + b
	case Subtract:
		result = a - b
	case Multiply:
		result = a * b
	case Divide:
		if b == 0 {
			return 0, ErrDivisionByZero
		}
		result = a / b
	case Power:
		result = math.Pow(a, b)
	case Sqrt:
		if a < 0 {
			return 0, ErrNegativeSqrt
		}
		result = math.Sqrt(a)
	case Percentage:
		result = (a / 100) * b
	default:
		return 0, fmt.Errorf("%w: %q", ErrUnsupportedOperation, op)
	}

	// encoding/json cannot marshal NaN or Inf, so surface these as a domain
	// error (e.g. an extreme Power call) instead of letting them reach the
	// HTTP layer as a broken response.
	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, ErrResultNotFinite
	}

	return result, nil
}
