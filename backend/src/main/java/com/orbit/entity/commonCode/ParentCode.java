package com.orbit.entity.commonCode;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "parent_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParentCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 엔티티 유형 구분 (예: PROJECT, PURCHASE_REQUEST 등)
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    // 코드 그룹 (예: STATUS, TYPE 등)
    @Column(name = "code_group", nullable = false, length = 50)
    private String codeGroup;

    // 코드 이름 (화면에 표시될 텍스트)
    @Column(name = "code_name", nullable = false, length = 100)
    private String codeName;

    // 코드 설명
    @Column(name = "description", length = 255)
    private String description;

    // 사용 여부
    @Column(name = "is_active", nullable = false)
    @Builder.Default // Lombok 빌더 기본값 설정
    private Boolean isActive = true;


    public String getCodeValue() {
        return this.entityType + "-" + this.codeGroup;
    }
}