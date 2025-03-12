package com.orbit.entity.project;

import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_attachments")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ProjectAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 원본 파일명
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    // 저장된 파일명 (UUID 등)
    @Column(name = "stored_filename", nullable = false, length = 255)
    private String storedFilename;

    // 파일 경로
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    // 파일 크기
    @Column(name = "file_size")
    private Long fileSize;

    // 파일 확장자
    @Column(name = "file_extension", length = 50)
    private String fileExtension;

    // 연관된 프로젝트
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // 업로드한 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private Member uploadedBy;

    // 업로드 시간
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    // 파일 설명 (선택)
    @Column(name = "description", length = 500)
    private String description;

    // 업로드 시간 자동 설정
    @PrePersist
    protected void onCreate() {
        this.uploadedAt = LocalDateTime.now();
    }
}