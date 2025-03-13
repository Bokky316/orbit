package com.orbit.entity.inspection;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 📎 검수 파일(InspectionFile) 엔티티
 * - 검수(`Inspection`)와 연결된 파일 정보 저장
 */
@Entity
@Table(name = "inspection_files")
@Getter
@Setter
@NoArgsConstructor
public class InspectionFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 파일 ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection; // 연결된 검수

    @Column(name = "file_path", nullable = false)
    private String filePath; // 파일 저장 경로

    @Column(name = "file_name")
    private String fileName; // 원본 파일명

    @Column(name = "file_type")
    private String fileType; // 파일 유형

    @Column(name = "file_size")
    private Long fileSize; // 파일 크기 (bytes)

    @Column(name = "upload_date", updatable = false)
    private LocalDateTime uploadDate; // 업로드 일시

    @Column(name = "description")
    private String description; // 파일 설명

    @PrePersist
    protected void onCreate() {
        uploadDate = LocalDateTime.now();
    }
}
