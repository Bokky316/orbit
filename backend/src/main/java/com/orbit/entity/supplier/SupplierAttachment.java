package com.orbit.entity.supplier;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 기본 생성자 추가 (필수)
@AllArgsConstructor // 전체 필드 생성자 추가 (선택)
public class SupplierAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String filePath;
    private String fileType;
    private Long fileSize;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_registration_id")
    private SupplierRegistration supplierRegistration;
}
