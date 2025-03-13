// PositionRepository.java
package com.orbit.repository.approval;

import com.orbit.entity.approval.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PositionRepository extends JpaRepository<Position, Long> {

    // 직급명으로 검색 (예: "과장")
    Optional<Position> findByName(String name);

    // 권한 레벨 이상의 직급 조회 (예: level >= 3)
    List<Position> findByLevelGreaterThanEqual(int level);

    // 직급 레벨로 정렬 조회
    List<Position> findAllByOrderByLevelAsc();

    // 직급 존재 여부 확인
    boolean existsByName(String name);
}
