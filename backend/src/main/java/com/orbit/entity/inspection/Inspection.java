package com.orbit.entity.inspection;

import com.orbit.entity.bidding.SimplifiedContract;
import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inspections")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"contract", "inspector"})  // Lazy 로딩 오류 방지
@EntityListeners(AuditingEntityListener.class)  // 자동 타임스탬프
public class Inspection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private SimplifiedContract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspector_id", nullable = false)
    private Member inspector;

    @Column(name = "inspection_date")
    private LocalDate inspectionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "result")
    private InspectionResult result;

    @Column(name = "comments")
    private String comments;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum InspectionResult {
        합격, 불합격
    }
}
