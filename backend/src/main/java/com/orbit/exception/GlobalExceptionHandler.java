package com.orbit.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 비즈니스 예외 처리
     */
    /*@ExceptionHandler(BusinessException.class)
    protected ResponseEntity<ApiResponse<Object>> handleBusinessException(BusinessException e) {
        log.error("BusinessException", e);
        ErrorCode errorCode = e.getErrorCode();
        return new ResponseEntity<>(
                ApiResponse.error(e.getMessage(), errorCode.getCode()),
                errorCode.getStatus()
        );*/
    }
