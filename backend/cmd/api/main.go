// Command api starts the calculator HTTP server.
package main

import (
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/JuanPabloBarrios30/fullstack-calculator/backend/internal/httpapi"
)

func main() {
	logger := log.New(os.Stdout, "", log.LstdFlags)

	port := getEnv("PORT", "8080")
	// Vite's default dev server port; overridable via ALLOWED_ORIGIN so
	// docker-compose or a deployed frontend can point at a different origin.
	allowedOrigin := getEnv("ALLOWED_ORIGIN", "http://localhost:5173")

	handler := httpapi.NewHandler(logger)

	chain := httpapi.Chain(
		httpapi.Logging(logger),
		httpapi.Recover(logger),
		httpapi.CORS(allowedOrigin),
	)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      chain(handler.Routes()),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	logger.Printf("server listening on port %s (allowed origin: %s)", port, allowedOrigin)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Fatalf("server failed: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return fallback
}
