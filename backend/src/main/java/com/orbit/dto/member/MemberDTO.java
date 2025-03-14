package com.orbit.dto.member;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberDTO {
    private Long id;
    private String username;
    private String name;
    private String email;
    private String contactNumber;
    private String companyName;
    private boolean enabled;
    private String role;

    // 중첩 객체로 부서 정보 포함
    private DepartmentInfo department;

    // 중첩 객체로 직급 정보 포함
    private PositionInfo position;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentInfo {
        private Long id;
        private String name;
        private String code;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PositionInfo {
        private Long id;
        private String name;
        private Integer level;
    }
}