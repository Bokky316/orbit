package com.orbit.dto.procurement;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 프로젝트 첨부파일 정보를 전송하기 위한 데이터 전송 객체 (DTO)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectAttachmentDTO {

    /**
     * 첨부파일의 고유 식별자
     */
    private Long id;

    /**
     * 첨부파일의 원본 파일명
     */
    private String fileName;

    /**
     * 첨부파일의 크기 (바이트 단위)
     */
    private Long fileSize;

    /**
     * 첨부파일의 확장자
     */
    private String fileExtension;

    /**
     * 첨부파일을 업로드한 사용자의 이름 또는 식별자
     */
    private String uploadedBy;

    /**
     * 첨부파일이 업로드된 날짜와 시간
     */
    private LocalDateTime uploadedAt;

    /**
     * 첨부파일에 대한 설명 또는 메모
     */
    private String description;
}