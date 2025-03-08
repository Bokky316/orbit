package com.orbit.entity.state;

import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 범용 상태 이력 관리 엔티티
 * - 어떤 엔티티의 상태 변경이든 기록 가능
 * - 다형성(polymorphic) 관계 지원
 */
@Entity
@Table(name = "status_histories")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusHistory {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 대상 엔티티 유형 (예: 프로젝트, 구매요청 등)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntityType entityType;

    /**
     * 대상 엔티티 ID (예: project_id, purchase_request_id)
     */
    @Column(nullable = false)
    private Long entityId;

    /**
     * 변경 전 상태
     */
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "from_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "from_child"))
    })
    private SystemStatus fromStatus;

    /**
     * 변경 후 상태
     */
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "to_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "to_child"))
    })
    private SystemStatus toStatus;

    /**
     * 변경 수행자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private Member changedBy;

    /**
     * 변경 일시
     */
    @Column(nullable = false)
    private LocalDateTime changedAt;

    /**
     * 지원하는 엔티티 유형
     */
    public enum EntityType {
        PROJECT,          // 프로젝트
        PURCHASE_REQUEST, // 구매요청
        BIDDING,          // 입찰
        CONTRACT,         // 계약
        PAYMENT           // 지급
    }
}
