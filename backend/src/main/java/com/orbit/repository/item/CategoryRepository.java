package com.orbit.repository.item;

import com.orbit.entity.item.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, String> {

    /**
     * 활성화된 모든 카테고리 조회 (useYn = 'Y')
     */
    @Query("SELECT c FROM Category c WHERE c.useYn = 'Y' ORDER BY c.id")
    List<Category> findAllActive();

    /**
     * 특정 ID의 카테고리와 연관된 품목(items) 함께 조회
     */
    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.items WHERE c.id = :id")
    Optional<Category> findByIdWithItems(String id);

    /**
     * 이름에 특정 문자열이 포함된 카테고리 조회
     */
    List<Category> findByNameContaining(String name);

    /**
     * 정확한 이름으로 카테고리 조회
     */
    Optional<Category> findByName(String name);

    /**
     * 특정 이름의 카테고리 존재 여부 확인
     */
    boolean existsByName(String name);

    /**
     * 활성화된 모든 카테고리와 연관된 아이템 함께 조회
     */
    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.items WHERE c.useYn = 'Y' ORDER BY c.name")
    List<Category> findAllActiveWithItems();
}