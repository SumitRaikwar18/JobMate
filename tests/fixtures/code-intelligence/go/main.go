package main

import (
	"database/sql"
	"net/http"
	"github.com/gin-gonic/gin"
)

type UserRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
}

type UserServer struct {
	db *sql.DB
}

func (s *UserServer) RegisterRoutes(r *gin.Engine) {
	r.GET("/api/v1/users", s.ListUsers)
	r.POST("/api/v1/users", s.CreateUser)
}

func (s *UserServer) ListUsers(c *gin.Context) {
	rows, err := s.db.Query("SELECT id, username FROM users")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (s *UserServer) CreateUser(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"status": "created"})
}
