package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractDto {
    private Long id;
    private Long biddingId;
    private Long supplierId;
    private String transactionNumber;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BigDecimal totalAmount;
    private ContractStatus status;
    private SignatureStatus signatureStatus;
    private String contractFilePath;

    public enum ContractStatus {
        초안, 서명중, 활성, 완료, 취소
    }

    public enum SignatureStatus {
        미서명, 내부서명, 완료
    }
}
