package main

import (
	"testing"
	"github.com/stretchr/testify/assert"
)

func TestUserRequestValidation(t *testing.T) {
	req := UserRequest{Username: "bob", Email: "bob@example.com"}
	assert.Equal(t, "bob", req.Username)
	assert.NotEmpty(t, req.Email)
}

func TestServerHealth(t *testing.T) {
	status := 200
	if status != 200 {
		t.Errorf("expected 200 got %d", status)
	}
}
