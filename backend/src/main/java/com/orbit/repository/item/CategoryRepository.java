package com.orbit.repository.item;


import com.orbit.entity.item.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // 필요한 경우 추가 쿼리 메서드 정의
}
