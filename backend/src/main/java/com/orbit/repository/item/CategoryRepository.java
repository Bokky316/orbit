package com.orbit.repository.item;

import com.orbit.entity.item.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, String> {

    @Query("SELECT c FROM Category c WHERE c.useYn = 'Y' ORDER BY c.id")
    List<Category> findAllActive();

    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.items WHERE c.id = :id")
    Optional<Category> findByIdWithItems(String id);

    List<Category> findByNameContaining(String name);

    Optional<Category> findByName(String name);

    boolean existsByName(String name);
}