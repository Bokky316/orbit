package com.orbit.repository.member;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
     * 결재 가능한 사용자 조회 (직급 레벨 3 이상)
     * @return 결재 가능한 사용자 리스트
     */
        @Query("SELECT m FROM Member m JOIN m.position p WHERE p.level >= :level")
        List<Member> findByPositionLevelGreaterThanEqual(@Param("level") int level);
    /**
     * 특정 부서의 특정 직급 이상인 멤버 조회
     * @param department 부서
     * @param positionLevel 직급 레벨
     * @return 해당 부서의 특정 직급 이상 멤버 리스트
     */
    @Query("SELECT m FROM Member m WHERE m.department = :department AND m.position.level > :positionLevel")
    List<Member> findByDepartmentAndPositionLevelGreaterThan(
            @Param("department") Department department,
            @Param("positionLevel") int positionLevel
    );

    /**
     * 특정 부서의 특정 직급 범위 멤버 조회
     * @param department 부서
     * @param minLevel 최소 직급 레벨
     * @param maxLevel 최대 직급 레벨
     * @return 해당 부서의 특정 직급 범위 멤버 리스트
     */
    @Query("SELECT m FROM Member m WHERE m.department = :department AND m.position.level BETWEEN :minLevel AND :maxLevel")
    List<Member> findByDepartmentAndPositionLevelBetween(
            @Param("department") Department department,
            @Param("minLevel") int minLevel,
            @Param("maxLevel") int maxLevel
    );

    /**
     * 특정 직급 이상의 멤버 조회
     * @param positionLevel 직급 레벨
     * @return 해당 직급 이상 멤버 리스트
     */
    @Query("SELECT m FROM Member m WHERE m.position.level > :positionLevel ORDER BY m.position.level DESC")
    List<Member> findByPositionLevelGreaterThan(@Param("positionLevel") int positionLevel);

    /**
     * 직급 순으로 정렬된 모든 멤버 조회 (높은 순)
     * @return 직급 순으로 정렬된 멤버 리스트
     */
    @Query("SELECT m FROM Member m ORDER BY m.position.level DESC")
    List<Member> findAllSortedByPositionLevel();

    /**
     * 부서별 결재 가능한 멤버 조회
     * @param department 부서
     * @param minLevel 최소 직급 레벨
     * @return 해당 부서의 결재 가능한 멤버 리스트
     */
    @Query("SELECT m FROM Member m WHERE m.department = :department AND m.position.level >= :minLevel")
    List<Member> findEligibleApproversByDepartment(
            @Param("department") Department department,
            @Param("minLevel") int minLevel
    );

    /**
     * 특정 부서 ID로 해당 부서에 속한 모든 회원 조회
     * @param departmentId 부서 ID
     * @return 해당 부서에 속한 회원 리스트
     */
    List<Member> findByDepartmentId(Long departmentId);
}