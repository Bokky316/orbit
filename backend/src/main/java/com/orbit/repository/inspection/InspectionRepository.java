package com.orbit.repository.inspection;

import com.orbit.entity.inspection.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * 📌 검수(Inspection) 데이터 액세스 레이어 (Repository)
 * - 검수 데이터를 DB에서 조회, 저장하는 역할
 */
public interface InspectionRepository extends JpaRepository<Inspection, Long> {

    /**
     * ✅ (1) 특정 계약 ID에 대한 검수 정보 조회
     * - 계약 ID(`contractId`)를 이용해 검수 데이터를 찾음.
     * - 검수 데이터가 존재하지 않으면 `Optional.empty()` 반환
     */
    Optional<Inspection> findByContractId(Long contractId);

    /**
     * ✅ (2) 특정 검수 결과(검수대기, 합격, 불합격 등)에 해당하는 검수 목록 조회
     * - `result` 값이 특정 리스트에 포함된 경우만 조회
     * - 주로 '합격', '불합격' 상태인 검수를 조회하는 데 사용됨.
     */
    List<Inspection> findByResultIn(List<Inspection.InspectionResult> results);

    /**
     * ✅ (3) 검수 담당자 ID로 검수 목록 조회
     * - 특정 검수자가 담당한 모든 검수 내역을 조회할 때 사용
     */
    List<Inspection> findByInspectorId(Long inspectorId);

    /**
     * ✅ (4) 특정 계약 ID에 대한 검수 내역 존재 여부 확인
     * - 계약 ID를 기준으로 검수 데이터가 있는지 확인
     */
    boolean existsByContractId(Long contractId);
}
