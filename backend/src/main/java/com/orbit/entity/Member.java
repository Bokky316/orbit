package com.orbit.entity;import com.orbit.dto.MemberFormDto;import jakarta.persistence.*;import lombok.Getter;import lombok.Setter;import org.springframework.security.core.GrantedAuthority;import org.springframework.security.core.authority.SimpleGrantedAuthority;import org.springframework.security.core.userdetails.UserDetails;import org.springframework.security.crypto.password.PasswordEncoder;import java.time.LocalDateTime;import java.util.Collection;import java.util.List;/** * 사용자 정보를 나타내는 엔티티 클래스 * Spring Security의 UserDetails 인터페이스를 구현하여 인증/인가에 사용 */@Entity@Table(name = "members")@Getter@Setterpublic class Member implements UserDetails {    @Id    @GeneratedValue(strategy = GenerationType.IDENTITY)    private Long id;    @Column(name = "username", length = 50, nullable = false, unique = true)    private String username; // 사용자 ID    @Column(name = "name", length = 50, nullable = false)    private String name; // 사용자 이름    @Column(name = "password", length = 255, nullable = false)    private String password;    @Column(name = "email", length = 100, nullable = false, unique = true)    private String email;    @Column(name = "company_name", length = 100, nullable = false)    private String companyName;    @Column(name = "contact_number", length = 20)    private String contactNumber;    @Column(name = "address")    private String address;    @ManyToOne(fetch = FetchType.LAZY)    @JoinColumn(name = "dept_id")    private Department department;    @ManyToOne(fetch = FetchType.LAZY)    @JoinColumn(name = "position_id")    private Position position;    @Enumerated(EnumType.STRING)    @Column(nullable = false)    private Role role;    @Column(name = "last_login_at")    private LocalDateTime lastLoginAt;    @Column(name = "created_at", updatable = false)    private LocalDateTime createdAt;    @Column(name = "updated_at")    private LocalDateTime updatedAt;    /**     * 엔티티가 처음 생성될 때 호출되어 생성 시간과 수정 시간을 설정     */    @PrePersist    protected void onCreate() {        createdAt = LocalDateTime.now();        updatedAt = LocalDateTime.now();    }    /**     * 엔티티가 수정될 때 호출되어 수정 시간을 갱신     */    @PreUpdate    protected void onUpdate() {        updatedAt = LocalDateTime.now();    }    /**     * 사용자 역할을 나타내는 Enum     */    public enum Role {        BUYER, SUPPLIER, ADMIN    }    /**     * MemberFormDto와 PasswordEncoder를 사용하여 새로운 Member 객체를 생성     * @param memberFormDto 회원가입 폼 데이터     * @param passwordEncoder 비밀번호 암호화를 위한 인코더     * @return 생성된 Member 객체     */    public static Member createMember(MemberFormDto memberFormDto, PasswordEncoder passwordEncoder) {        Member member = new Member();        member.setUsername(memberFormDto.getUsername());        member.setName(memberFormDto.getName());        member.setPassword(passwordEncoder.encode(memberFormDto.getPassword()));        member.setEmail(memberFormDto.getEmail());        member.setCompanyName(memberFormDto.getCompanyName());        member.setContactNumber(memberFormDto.getContactNumber());        member.setAddress(memberFormDto.getAddress());        member.setRole(Role.BUYER); // 기본 역할을 BUYER로 설정        return member;    }    /**     * 사용자의 권한 목록을 반환     * @return 권한 목록     */    @Override    public Collection<? extends GrantedAuthority> getAuthorities() {        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));    }    /**     * 사용자의 ID를 반환 (Spring Security에서 사용)     * @return 사용자 ID     */    @Override    public String getUsername() {        return this.username;    }    /**     * 계정 만료 여부를 반환     * @return 계정이 만료되지 않았으면 true     */    @Override    public boolean isAccountNonExpired() {        return true;    }    /**     * 계정 잠금 여부를 반환     * @return 계정이 잠기지 않았으면 true     */    @Override    public boolean isAccountNonLocked() {        return true;    }    /**     * 자격 증명(비밀번호) 만료 여부를 반환     * @return 자격 증명이 만료되지 않았으면 true     */    @Override    public boolean isCredentialsNonExpired() {        return true;    }    /**     * 계정 활성화 여부를 반환     * @return 계정이 활성화되어 있으면 true     */    @Override    public boolean isEnabled() {        return true;    }}