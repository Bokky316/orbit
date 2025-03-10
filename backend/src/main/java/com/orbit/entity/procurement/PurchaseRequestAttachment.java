package com.orbit.entity.procurement;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 기본 생성자 추가 (필수)
@AllArgsConstructor // 전체 필드 생성자 추가 (선택)
public class PurchaseRequestAttachment {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long fileSize;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id")
    private PurchaseRequest purchaseRequest;
}
