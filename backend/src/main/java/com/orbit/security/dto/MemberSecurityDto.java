package com.orbit.security.dto;

import com.orbit.entity.approval.Department; // Department 엔티티 import
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

@Getter
@Setter
@ToString
public class MemberSecurityDto extends User {

    private Long id;              // 사용자 고유 ID
    private String email;         // 사용자 이메일
    private String username;      // 사용자 로그인 ID (로그인 시 사용)
    private String name;          // 사용자 실제 이름
    private String companyName;   // 회사명
    private String contactNumber; // 연락처
    private String postalCode;    // 우편번호
    private String roadAddress;   // 도로명 주소
    private String detailAddress; // 상세 주소
    private Department department; // 부서 정보 추가

    public MemberSecurityDto(Long id,
                             String email,
                             String password,
                             Collection<? extends GrantedAuthority> authorities,
                             String username,
                             String name,
                             String companyName,
                             String contactNumber,
                             String postalCode,
                             String roadAddress,
                             String detailAddress,
                             Department department) { // 생성자에 department 추가
        super(username, password, authorities);
        this.id = id;
        this.email = email;
        this.username = username;
        this.name = name;
        this.companyName = companyName;
        this.contactNumber = contactNumber;
        this.postalCode = postalCode;
        this.roadAddress = roadAddress;
        this.detailAddress = detailAddress;
        this.department = department; // department 필드 초기화
    }

    @Override
    public String getUsername() {
        return username;
    }

    public String getRealName() {
        return name;
    }

    public String getFullAddress() {
        return String.format("%s %s %s", postalCode, roadAddress, detailAddress);
    }
}