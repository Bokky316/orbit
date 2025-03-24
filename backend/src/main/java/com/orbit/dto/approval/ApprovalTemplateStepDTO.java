package com.orbit.dto.approval;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalTemplateStepDTO {

    @Min(value = 1, message = "단계는 1 이상이어야 합니다")
    private int step;

    // @NotNull 어노테이션 제거
    private DepartmentDTO department;

    @Min(value = 1, message = "최소 레벨은 1 이상이어야 합니다")
    private int minLevel;

    @Min(value = 1, message = "최대 레벨은 1 이상이어야 합니다")
    private int maxLevel;

    private String description;

    // 기안자 포함 여부 필드
    private boolean includeRequester;

    // 결재자 역할 필드 추가
    private String approverRole;

    // 커스텀 검증 메소드
    @AssertTrue(message = "일반 결재자의 경우 부서 정보는 필수입니다")
    public boolean isDepartmentValid() {
        // REQUESTER 역할인 경우 부서 정보 검증 건너뛰기
        return "REQUESTER".equals(approverRole) || department != null;
    }
}