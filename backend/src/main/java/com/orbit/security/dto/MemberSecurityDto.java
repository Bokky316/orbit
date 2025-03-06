package com.orbit.security.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

/**
 * Spring Security에서 사용자 정보를 담는 DTO (Data Transfer Object) 클래스
 * User 클래스를 상속받아 기본적인 인증 정보를 포함하며, 추가적인 사용자 정보를 저장합니다.
 */
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
    private String address;       // 주소

    /**
     * MemberSecurityDto 생성자
     * @param id 사용자 ID
     * @param email 사용자 이메일
     * @param password 비밀번호
     * @param authorities 권한 목록
     * @param username 사용자 로그인 ID (로그인 시 사용)
     * @param name 사용자 실제 이름
     * @param companyName 회사명
     * @param contactNumber 연락처
     * @param address 주소
     */
    public MemberSecurityDto(Long id,
                             String email,
                             String password,
                             Collection<? extends GrantedAuthority> authorities,
                             String username,
                             String name,
                             String companyName,
                             String contactNumber,
                             String address) {
        super(username, password, authorities); // username을 사용자 식별자로 사용
        this.id = id;
        this.email = email;
        this.username = username;
        this.name = name;
        this.companyName = companyName;
        this.contactNumber = contactNumber;
        this.address = address;
    }

    /**
     * Spring Security에서 사용하는 사용자 식별자를 반환합니다.
     * 여기서는 username을 사용자 식별자로 사용합니다.
     * @return 사용자 ID (username)
     */
    @Override
    public String getUsername() {
        return username;
    }

    /**
     * 사용자의 실제 이름을 반환합니다.
     * @return 사용자 이름
     */
    public String getRealName() {
        return name;
    }
}
