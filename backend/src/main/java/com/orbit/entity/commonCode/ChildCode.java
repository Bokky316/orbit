package com.orbit.entity.commonCode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "child_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChildCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 상위 코드 참조
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_code_id", nullable = false)
    private ParentCode parentCode;

    // 코드 값
    @Column(name = "code_value", nullable = false, length = 50)
    private String codeValue;

    // 코드 이름 (화면에 표시될 텍스트)
    @Column(name = "code_name", nullable = false, length = 100)
    private String codeName;

    // 코드 설명
    @Column(name = "description", length = 255)
    private String description;

    // 정렬 순서
    @Column(name = "display_order")
    private Integer displayOrder;

    // 사용 여부
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * 전체 코드 반환 (예: PROJECT-STATUS-PLANNING)
     */
    public String getFullCode() {
        return parentCode.getEntityType() + "-" +
                parentCode.getCodeGroup() + "-" +
                codeValue;
    }
}
