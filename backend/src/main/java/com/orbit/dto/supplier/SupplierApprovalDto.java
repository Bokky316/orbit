package com.orbit.dto.supplier;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierApprovalDto {
    @NotBlank(message = "상태 코드는 필수입니다.")
    private String statusCode; // PENDING, APPROVED, REJECTED, SUSPENDED, BLACKLIST

    private String rejectionReason; // 거절 사유 (승인 시에는 null)
}
