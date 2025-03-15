package com.orbit.entity.member;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.orbit.dto.member.MemberFormDto;
import com.orbit.entity.approval.ApprovalLine;
import com.orbit.entity.approval.Department;
import com.orbit.entity.approval.Position;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 시스템 사용자 정보 및 권한 관리를 위한 핵심 엔티티
 * 결재선 관리 기능 확장을 위해 ApprovalLine과의 연관 관계 추가
 *
 * 주요 특징:
 * - Spring Security의 UserDetails 구현체
 * - 부서/직급/결재선 3중 연관 관계
 * - 활성화/비활성화 상태 관리
 * - 주소 정보 포함
 */
@Entity
@Table(name = "members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member implements UserDetails {

    // ============== 기본 정보 필드 ==============
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", length = 50, nullable = false, unique = true)
    private String username; // 로그인 ID

    @Column(name = "name", length = 50, nullable = false)
    private String name; // 실명

    @Column(name = "password", length = 255, nullable = false)
    private String password;

    // ============== 연락처 및 주소 정보 ==============
    @Column(name = "email", length = 100, nullable = false, unique = true)
    private String email;

    @Column(name = "contact_number", length = 20)
    private String contactNumber;

    @Column(name = "postal_code", length = 10)
    private String postalCode;

    @Column(name = "road_address")
    private String roadAddress;

    @Column(name = "detail_address")
    private String detailAddress;

    // ============== 조직 관계 필드 ==============
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @Column(name = "company_name", length = 100, nullable = false)
    private String companyName;

    // ============== 결재선 연관 관계 추가 ==============
    @OneToMany(mappedBy = "approver", fetch = FetchType.LAZY)
    @Builder.Default
    private List<ApprovalLine> approvalLines = new ArrayList<>();

    // ============== 보안 및 상태 필드 ==============
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "enabled")
    private boolean enabled;

    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;

    // ============== 연관 관계 편의 메서드 ==============
    /**
     * 부서 설정 시 양방향 관계 자동 관리
     */
    public void setDepartment(Department department) {
        if(this.department != null) {
            this.department.getMembers().remove(this);
        }
        this.department = department;
        if(department != null && !department.getMembers().contains(this)) {
            department.getMembers().add(this);
        }
    }

    /**
     * 직급 설정 시 양방향 관계 자동 관리
     */
    public void setPosition(Position position) {
        if(this.position != null) {
            this.position.getMembers().remove(this);
        }
        this.position = position;
        if(position != null && !position.getMembers().contains(this)) {
            position.getMembers().add(this);
        }
    }

    // ============== 생명주기 콜백 ==============
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        this.enabled = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ============== 비즈니스 로직 메서드 ==============
    /**
     * 회원 생성 빌더 메서드
     * @param memberFormDto 사용자 입력 데이터
     * @param passwordEncoder 패스워드 암호화 인코더
     */
    public static Member createMember(MemberFormDto memberFormDto, PasswordEncoder passwordEncoder) {
        return Member.builder()
                .username(memberFormDto.getUsername())
                .name(memberFormDto.getName())
                .password(passwordEncoder.encode(memberFormDto.getPassword()))
                .email(memberFormDto.getEmail())
                .companyName(memberFormDto.getCompanyName())
                .contactNumber(memberFormDto.getContactNumber())
                .postalCode(memberFormDto.getPostalCode())
                .roadAddress(memberFormDto.getRoadAddress())
                .detailAddress(memberFormDto.getDetailAddress())
                .role(Role.BUYER)
                .enabled(true)
                .build();
    }

    /**
     * 권한 추가 메서드 (RBAC 구현용)
     */
    public void addAuthority(String authority) {
        if (this.role == null) {
            this.role = Role.valueOf(authority);
        }
    }

    // ============== UserDetails 구현 메서드 ==============
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // ============== 상태 관리 메서드 ==============
    public void deactivateMember() {
        this.enabled = false;
        this.deactivatedAt = LocalDateTime.now();
    }

    public void activateMember() {
        this.enabled = true;
        this.deactivatedAt = null;
    }

    // ============== ENUM 정의 ==============
    public enum Role {
        BUYER,     // 구매 담당자
        SUPPLIER,  // 공급업체 사용자
        ADMIN      // 시스템 관리자
    }

    // ============== 결재선 관련 추가 메서드 ==============
    /**
     * 사용자가 결재자로 지정된 결재선 조회
     */
//    public List<ApprovalLine> getPendingApprovals() {
//        return this.approvalLines.stream()
//                .filter(line -> line.getStatus() == ApprovalLine.ApprovalStatus.IN_REVIEW)
//                .toList();
//    }

    /**
     * 결재 권한 여부 확인
     */
    public boolean hasApprovalAuthority() {
        return this.position != null &&
                this.position.getLevel() >= Position.MIN_APPROVAL_LEVEL;
    }
}
