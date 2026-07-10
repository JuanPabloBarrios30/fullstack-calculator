package calculator

import (
	"errors"
	"math"
	"testing"
)

func TestCalculate_Success(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		op   Operation
		a, b float64
		want float64
	}{
		{"add positive numbers", Add, 2, 3, 5},
		{"add negative numbers", Add, -2, -3, -5},
		{"subtract", Subtract, 10, 4, 6},
		{"multiply", Multiply, 6, 7, 42},
		{"multiply by zero", Multiply, 6, 0, 0},
		{"divide", Divide, 10, 4, 2.5},
		{"power", Power, 2, 10, 1024},
		{"power with zero exponent", Power, 5, 0, 1},
		{"sqrt of a perfect square", Sqrt, 81, 0, 9},
		{"sqrt of zero", Sqrt, 0, 0, 0},
		{"percentage: 10 percent of 200", Percentage, 10, 200, 20},
		{"percentage: 50 percent of 50", Percentage, 50, 50, 25},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got, err := Calculate(tt.op, tt.a, tt.b)
			if err != nil {
				t.Fatalf("Calculate(%v, %v, %v) returned unexpected error: %v", tt.op, tt.a, tt.b, err)
			}
			if got != tt.want {
				t.Errorf("Calculate(%v, %v, %v) = %v, want %v", tt.op, tt.a, tt.b, got, tt.want)
			}
		})
	}
}

func TestCalculate_Errors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		op      Operation
		a, b    float64
		wantErr error
	}{
		{"division by zero", Divide, 10, 0, ErrDivisionByZero},
		{"sqrt of a negative number", Sqrt, -4, 0, ErrNegativeSqrt},
		{"unsupported operation", Operation("modulo"), 1, 2, ErrUnsupportedOperation},
		{"result overflows to infinity", Power, 10, 400, ErrResultNotFinite},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			_, err := Calculate(tt.op, tt.a, tt.b)
			if !errors.Is(err, tt.wantErr) {
				t.Errorf("Calculate(%v, %v, %v) error = %v, want %v", tt.op, tt.a, tt.b, err, tt.wantErr)
			}
		})
	}
}

func TestCalculate_NaNResult(t *testing.T) {
	t.Parallel()

	// 0 raised to a negative power is +Inf in IEEE 754, but Pow(0, NaN)-style
	// edge cases can produce NaN; the case below (Inf - Inf via Pow) covers
	// the NaN branch of the finiteness check.
	got, err := Calculate(Power, math.Inf(1), 0)
	if err != nil {
		t.Fatalf("Calculate(Power, +Inf, 0) returned unexpected error: %v", err)
	}
	if got != 1 {
		t.Errorf("Calculate(Power, +Inf, 0) = %v, want 1", got)
	}
}

func TestIsValidOperation(t *testing.T) {
	t.Parallel()

	valid := []Operation{Add, Subtract, Multiply, Divide, Power, Sqrt, Percentage}
	for _, op := range valid {
		if !IsValidOperation(op) {
			t.Errorf("IsValidOperation(%v) = false, want true", op)
		}
	}

	if IsValidOperation(Operation("modulo")) {
		t.Error("IsValidOperation(\"modulo\") = true, want false")
	}
}

func TestRequiresSecondOperand(t *testing.T) {
	t.Parallel()

	if RequiresSecondOperand(Sqrt) {
		t.Error("RequiresSecondOperand(Sqrt) = true, want false")
	}

	binary := []Operation{Add, Subtract, Multiply, Divide, Power, Percentage}
	for _, op := range binary {
		if !RequiresSecondOperand(op) {
			t.Errorf("RequiresSecondOperand(%v) = false, want true", op)
		}
	}
}
