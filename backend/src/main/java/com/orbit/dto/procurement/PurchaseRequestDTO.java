package com.orbit.dto.procurement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

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

    private Long id; // 구매 요청 ID

    // 문자열 타입으로 프로젝트 ID 추가
    private String projectId; // 프로젝트 ID (UUID 형식)

    // 프로젝트 이름 추가 (응답용)
    private String projectName;

    private String requestName; // 요청명

    private String requestNumber; // 요청 번호

    private String status; // 진행 상태

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate requestDate; // 요청일

    private String customer; // 고객사

    private String businessDepartment; // 사업 부서

    private String businessManager; // 사업 담당자

    @PositiveOrZero @Digits(integer=15, fraction=2)
    private BigDecimal businessBudget; // 사업 예산

    private String specialNotes; // 특이 사항

    @Pattern(regexp = "^01[0-9]{8,9}$")
    private String managerPhoneNumber; // 담당자 핸드폰 번호

    private String projectContent; // 사업 내용

    // 사용자 정보 (응답용 필드)
    private Long memberId; // 요청자 ID
    private String memberName; // 요청자 이름
    private String memberCompany; // 요청자 회사

    // 응답용 필드 추가
    private List<PurchaseRequestAttachmentDTO> attachments; // 첨부 파일 목록

    @Valid // GoodsRequestDTO에서만 사용
    private List<PurchaseRequestItemDTO> items; // 품목 목록 (GoodsRequestDTO에서만 사용)
}