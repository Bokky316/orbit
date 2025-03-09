package com.orbit.entity.inspection;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inspection_files") // "inspection_files" 테이블과 매핑
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InspectionFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 자동 증가 ID
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // 검수 엔티티와 연관 (지연 로딩)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspections inspection;  // 검수 ID 참조 (검수에 속함)

    @Column(nullable = false, length = 255) // 파일 경로 (필수)
    private String filePath;

    @Column(length = 255) // 원본 파일명 (선택)
    private String fileName;

    @Column(length = 50) // 파일 유형 (ex: PDF, JPG 등)
    private String fileType;

    private Long fileSize; // 파일 크기 (bytes)

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadDate = LocalDateTime.now(); // 업로드 일시 (자동 설정)

    @Column(columnDefinition = "TEXT") // 파일 설명 (긴 문자열 허용)
    private String description;
}
