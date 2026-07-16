package com.english.learning.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception e) {
        // Prevent leak of internal stack traces, JPA queries, or JWT credentials
        return ResponseEntity.status(500).body(Map.of("error", "An unexpected error occurred. Please try again."));
    }
}
