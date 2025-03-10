package com.orbit.entity.procurement;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@DiscriminatorValue("MAINTENANCE")
@Getter
@Setter
public class MaintenanceRequest extends PurchaseRequest {

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(nullable = false) // 필수 필드로 지정
    private LocalDate contractStartDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(nullable = false) // 필수 필드로 지정
    private LocalDate contractEndDate;

    @Positive(message = "계약 금액은 양수여야 합니다") // 검증 추가
    @Column(precision = 19, scale = 2, nullable = false) // DB 설정 강화
    private BigDecimal contractAmount;

    @Lob
    @Column(nullable = false, length = 2000) // 길이 제한 추가
    private String contractDetails;
}
