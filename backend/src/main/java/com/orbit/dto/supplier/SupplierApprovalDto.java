package com.orbit.dto.supplier;

import com.orbit.constant.SupplierStatus;
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
    @NotBlank(message = "승인 상태는 필수입니다.")
    private SupplierStatus status;

    private String rejectionReason; // 거절 사유 (승인 시에는 null)
}
