package com.orbit.entity.commonCode;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

@Embeddable
@Getter
@Setter
public class SystemStatus {
    @Column(name = "status_parent_code", length = 50)
    private String parentCode;

    @Column(name = "status_child_code", length = 50)
    private String childCode;

    // 상태 코드 조합
    public String getFullCode() {
        return parentCode + "-" + childCode;
    }

    // 기본 생성자
    public SystemStatus() {}

    // 파라미터 생성자
    public SystemStatus(String parentCode, String childCode) {
        this.parentCode = parentCode;
        this.childCode = childCode;
    }

    @Override
    public String toString() {
        return getFullCode();
    }
}