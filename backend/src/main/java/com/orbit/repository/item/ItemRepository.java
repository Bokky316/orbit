package com.orbit.repository.item;

import com.orbit.entity.item.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, String> {

    // 기존 메서드 정리
    @Query("SELECT i FROM Item i WHERE i.useYn = 'Y'")
    List<Item> findAllActive();

    @Query("SELECT i FROM Item i WHERE i.category.id = :categoryId AND i.useYn = 'Y'")
    List<Item> findActiveByCategoryId(@Param("categoryId") String categoryId);

    // 카테고리만 조회
    @Query("SELECT i FROM Item i JOIN FETCH i.category WHERE i.id = :id")
    Optional<Item> findByIdWithCategory(@Param("id") String id);

    // 단위 부모 코드 조회 (필요 시)
    @Query("SELECT i FROM Item i JOIN FETCH i.unitParentCode WHERE i.id = :id")
    Optional<Item> findByIdWithUnitParent(@Param("id") String id);

    // 카테고리 + 단위 부모 코드 조회 (필요 시)
    @Query("SELECT i FROM Item i " +
            "JOIN FETCH i.category " +
            "JOIN FETCH i.unitParentCode " +
            "WHERE i.id = :id")
    Optional<Item> findByIdWithCategoryAndUnitParent(@Param("id") String id);


    Optional<Item> findByCode(String code);
    boolean existsByCode(String code);
    List<Item> findByNameContaining(String name);

    @Query("SELECT i FROM Item i WHERE i.name LIKE %:keyword% OR i.code LIKE %:keyword% OR i.specification LIKE %:keyword%")
    Page<Item> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT i FROM Item i WHERE i.category.id = :categoryId AND (i.name LIKE %:keyword% OR i.code LIKE %:keyword% OR i.specification LIKE %:keyword%)")
    Page<Item> searchByCategoryAndKeyword(@Param("categoryId") String categoryId, @Param("keyword") String keyword, Pageable pageable);
}
