package com.orbit.entity.code;

import com.orbit.entity.commonCode.CommonCode;
import com.orbit.entity.commonCode.CommonCodeGroup;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SystemStatus {
    private String parentCode;
    private String childCode;

    /**
     * 전체 코드값 반환 (예: "PURCHASE_REQUEST-REQUESTED")
     */
    public String getFullCode() {
        return parentCode + "-" + childCode;
    }

    /**
     * 코드값으로부터 SystemStatus 생성
     */
    public static SystemStatus from(String fullCode) {
        String[] parts = fullCode.split("-");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid status code format: " + fullCode);
        }
        return new SystemStatus(parts[0], parts[1]);
    }

    /**
     * CommonCode로부터 SystemStatus 생성
     */
    public static SystemStatus fromCommonCode(CommonCodeGroup group, CommonCode code) {
        return new SystemStatus(group.getId(), code.getId());
    }
}