package com.orbit.entity.inspection;

import com.orbit.entity.bidding.SimplifiedContract;
import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "inspections") // 데이터베이스의 "inspections" 테이블과 매핑
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inspections {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 자동 증가 ID
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // 계약 정보 참조 (지연 로딩)
    @JoinColumn(name = "contract_id", nullable = false)
    private SimplifiedContract contract;  // 계약 ID 참조

    @ManyToOne(fetch = FetchType.LAZY) // 검수자 정보 참조 (지연 로딩)
    @JoinColumn(name = "inspector_id", nullable = false)
    private Member inspector;  // 검수자 ID 참조

    private LocalDate inspectionDate; // 검수일

    @Enumerated(EnumType.STRING) // ENUM 값을 문자열로 저장
    private InspectionResult result;  // 검수 결과 (대기, 합격, 불합격 등)

    @Column(columnDefinition = "TEXT") // 긴 문자열 저장 가능
    private String comments; // 검수 의견

    // 🔽 검수 항목 평가 (ENUM 타입)
    @Enumerated(EnumType.STRING)
    private QuantityStatus quantityStatus; // 수량 상태 (정상, 부족, 초과)

    @Enumerated(EnumType.STRING)
    private QualityStatus qualityStatus; // 품질 상태 (양호, 불량)

    @Enumerated(EnumType.STRING)
    private PackagingStatus packagingStatus; // 포장 상태 (양호, 불량)

    @Enumerated(EnumType.STRING)
    private SpecMatchStatus specMatchStatus; // 규격 일치 여부 (일치, 불일치)

    // 🔽 검수 파일 리스트 (1:N 관계)
    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InspectionFile> inspectionFiles; // 검수 파일 목록

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now(); // 생성일시 (변경 불가)

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now(); // 수정일시 (자동 업데이트)

    // 검수 결과 ENUM
    public enum InspectionResult {
        검수대기, // 검수 대기 상태
        합격, // 검수 합격
        불합격, // 검수 불합격
        반품요청, // 반품 요청
        재검수요청 // 재검수 요청
    }

    // 수량 상태 ENUM
    public enum QuantityStatus {
        정상, // 정상 수량
        부족, // 부족함
        초과 // 초과됨
    }

    // 품질 상태 ENUM
    public enum QualityStatus {
        양호, // 품질 양호
        불량 // 품질 불량
    }

    // 포장 상태 ENUM
    public enum PackagingStatus {
        양호, // 포장 양호
        불량 // 포장 불량
    }

    // 규격 일치 여부 ENUM
    public enum SpecMatchStatus {
        일치, // 규격 일치
        불일치 // 규격 불일치
    }
}
