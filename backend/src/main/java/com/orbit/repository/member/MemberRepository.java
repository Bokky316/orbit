package com.orbit.repository.member;

import com.orbit.entity.member.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import com.orbit.entity.approval.Department;
import com.orbit.entity.member.Member;

/**
 * Member 엔티티를 위한 JpaRepository
 */
public interface MemberRepository extends JpaRepository<Member, Long>, JpaSpecificationExecutor<Member> {

    /**
     * 사용자 ID(username)로 회원 정보 조회
     * @param username 사용자 ID
     * @return Optional<Member> 객체
     */
    Optional<Member> findByUsername(String username);

    /**
     * 이메일로 회원 정보 조회
     * @param email 이메일 주소
     * @return Member 객체
     */
    Member findByEmail(String email);

    /**
     * 이름으로 회원 검색 (검색어가 포함된 모든 사용자 반환)
     * @param name 검색어
     * @return 검색 결과 리스트
     */
    List<Member> findByNameContainingIgnoreCase(String name);

    /**
     * 검수 작업이 가장 적은 품질관리부 담당자 찾기
     * - `QualityControl` 부서에서 가장 적은 검수 건수를 가진 담당자를 찾음
     * - 만약 검수 담당자가 없으면 `Optional.empty()` 반환
     */
    @Query("SELECT m FROM Member m JOIN m.position p WHERE p.level >= 3")
    List<Member> findEligibleApprovalMembers();
}
