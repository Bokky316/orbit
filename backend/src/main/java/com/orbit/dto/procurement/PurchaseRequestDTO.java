package com.orbit.dto.procurement;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "businessType",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = SIRequestDTO.class, name = "SI"),
        @JsonSubTypes.Type(value = MaintenanceRequestDTO.class, name = "MAINTENANCE"),
        @JsonSubTypes.Type(value = GoodsRequestDTO.class, name = "GOODS")
})
@Getter @Setter
public abstract class PurchaseRequestDTO {
    @NotNull(message = "사업 구분은 필수 항목입니다")
    @Schema(description = "사업 구분 (SI, MAINTENANCE, GOODS)", example = "SI", required = true)
    private String businessType;

    @NotBlank(message = "요청명은 필수 입력 값입니다.")
    private String requestName; // 요청명

    private LocalDate requestDate; // 요청일 (자동 생성)

    @NotBlank(message = "고객사는 필수 입력 값입니다.")
    private String customer; // 고객사

    @NotBlank(message = "사업 부서는 필수 입력 값입니다.")
    private String businessDepartment; // 사업 부서

    @NotBlank(message = "사업 담당자는 필수 입력 값입니다.")
    private String businessManager; // 사업 담당자

    private String businessType; // 사업 구분

    private Long businessBudget; // 사업 예산

    private String specialNotes; // 특이 사항

    private String managerPhoneNumber; // 담당자 핸드폰 번호

    private LocalDate projectStartDate; // 사업 기간 (시작일)

    private LocalDate projectEndDate; // 사업 기간 (종료일)

    private String projectContent; // 사업 내용

    private String attachments; // 첨부 파일 목록

    private List<PurchaseRequestItemDTO> purchaseRequestItemDTOs; // 구매 요청 아이템 목록
}
