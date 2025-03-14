// ItemRepository.java
package com.orbit.repository.item;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.item.Item;

public interface ItemRepository extends JpaRepository<Item, String> {

    @Query("SELECT i FROM Item i WHERE i.useYn = 'Y'")
    List<Item> findAllActive();

    @Query("SELECT i FROM Item i WHERE i.category.id = :categoryId AND i.useYn = 'Y'")
    List<Item> findActiveByCategoryId(@Param("categoryId") String categoryId);

    @Query("SELECT i FROM Item i JOIN FETCH i.category WHERE i.id = :id")
    Optional<Item> findByIdWithCategory(@Param("id") String id);

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.unitParentCode LEFT JOIN FETCH i.unitChildCode WHERE i.id = :id")
    Optional<Item> findByIdWithUnit(@Param("id") String id); //--스프링부트 실행에 오류가 있어 수정

    @Query("SELECT i FROM Item i JOIN FETCH i.category LEFT JOIN FETCH i.unitParentCode LEFT JOIN FETCH i.unitChildCode WHERE i.id = :id")
    Optional<Item> findByIdWithCategoryAndUnit(@Param("id") String id); //--스프링부트 실행에 오류가 있어 수정

    Optional<Item> findByCode(String code);

    boolean existsByCode(String code);

    List<Item> findByNameContaining(String name);

    @Query("SELECT i FROM Item i WHERE i.name LIKE %:keyword% OR i.code LIKE %:keyword% OR i.specification LIKE %:keyword%")
    Page<Item> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT i FROM Item i WHERE i.category.id = :categoryId AND (i.name LIKE %:keyword% OR i.code LIKE %:keyword% OR i.specification LIKE %:keyword%)")
    Page<Item> searchByCategoryAndKeyword(@Param("categoryId") String categoryId, @Param("keyword") String keyword, Pageable pageable);
}
