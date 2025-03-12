package com.orbit.exception;

/**
 * 결재 프로세스 중 발생할 수 있는 예외를 나타내는 클래스
 * 결재 진행 중 비즈니스 로직 위반이나 처리 불가능한 상황에서 사용
 */
public class ApprovalException extends RuntimeException {

    /**
     * 기본 생성자
     */
    public ApprovalException() {
        super();
    }

    /**
     * 메시지를 포함한 생성자
     * @param message 예외에 대한 상세 메시지
     */
    public ApprovalException(String message) {
        super(message);
    }

    /**
     * 메시지와 원인 예외를 포함한 생성자
     * @param message 예외에 대한 상세 메시지
     * @param cause 원인이 되는 예외
     */
    public ApprovalException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * 원인 예외를 포함한 생성자
     * @param cause 원인이 되는 예외
     */
    public ApprovalException(Throwable cause) {
        super(cause);
    }
}