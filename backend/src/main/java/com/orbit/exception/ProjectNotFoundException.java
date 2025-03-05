package com.orbit.exception;

/**
 * 프로젝트를 찾을 수 없을 때 발생하는 예외
 */
public class ProjectNotFoundException extends RuntimeException {

    /**
     * 예외 메시지를 받는 생성자
     * @param message 예외 메시지
     */
    public ProjectNotFoundException(String message) {
        super(message);
    }
}
