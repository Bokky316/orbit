package com.orbit.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * 전역 예외 처리 핸들러
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * ProjectNotFoundException 예외를 처리합니다.
     * @param ex ProjectNotFoundException 예외
     * @return 404 Not Found 상태 코드와 예외 메시지를 담은 ResponseEntity
     */
    @ExceptionHandler(ProjectNotFoundException.class)
    public ResponseEntity<String> handleProjectNotFoundException(ProjectNotFoundException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    /**
     * 일반적인 예외를 처리합니다.
     * @param ex Exception 예외
     * @return 500 Internal Server Error 상태 코드와 예외 메시지를 담은 ResponseEntity
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenericException(Exception ex) {
        return new ResponseEntity<>("An error occurred: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
