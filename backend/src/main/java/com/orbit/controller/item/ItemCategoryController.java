package com.orbit.controller.item;

import com.orbit.dto.item.CategoryDTO;
import com.orbit.dto.item.ItemDTO;
import com.orbit.service.item.ItemCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ItemCategoryController {
    private final ItemCategoryService itemCategoryService;

    // 카테고리 관련 엔드포인트
    @PostMapping("/categories")
    public ResponseEntity<CategoryDTO> createCategory(@RequestBody CategoryDTO categoryDTO) {
        CategoryDTO createdCategory = itemCategoryService.createCategory(categoryDTO);
        return new ResponseEntity<>(createdCategory, HttpStatus.CREATED);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDTO>> getAllActiveCategories() {
        List<CategoryDTO> categories = itemCategoryService.getAllActiveCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/categories/{categoryId}")
    public ResponseEntity<CategoryDTO> getCategoryWithItems(@PathVariable String categoryId) {
        CategoryDTO category = itemCategoryService.getCategoryWithItems(categoryId);
        return ResponseEntity.ok(category);
    }

    @PutMapping("/categories/{categoryId}")
    public ResponseEntity<CategoryDTO> updateCategory(
            @PathVariable String categoryId,
            @RequestBody CategoryDTO categoryDTO) {
        categoryDTO.setId(categoryId);
        CategoryDTO updatedCategory = itemCategoryService.updateCategory(categoryDTO);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<Void> deactivateCategory(@PathVariable String categoryId) {
        itemCategoryService.deactivateCategory(categoryId);
        return ResponseEntity.noContent().build();
    }

    // 아이템 관련 엔드포인트
    @PostMapping("/items")
    public ResponseEntity<ItemDTO> createItem(@RequestBody ItemDTO itemDTO) {
        ItemDTO createdItem = itemCategoryService.createItem(itemDTO);
        return new ResponseEntity<>(createdItem, HttpStatus.CREATED);
    }

    @GetMapping("/items")
    public ResponseEntity<List<ItemDTO>> getAllActiveItems() {
        List<ItemDTO> items = itemCategoryService.getAllActiveItems();
        return ResponseEntity.ok(items);
    }

    @GetMapping("/categories/{categoryId}/items")
    public ResponseEntity<List<ItemDTO>> getActiveByCategoryId(@PathVariable String categoryId) {
        List<ItemDTO> items = itemCategoryService.getActiveByCategoryId(categoryId);
        return ResponseEntity.ok(items);
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ItemDTO> updateItem(
            @PathVariable String itemId,
            @RequestBody ItemDTO itemDTO) {
        itemDTO.setId(itemId);
        ItemDTO updatedItem = itemCategoryService.updateItem(itemDTO);
        return ResponseEntity.ok(updatedItem);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deactivateItem(@PathVariable String itemId) {
        itemCategoryService.deactivateItem(itemId);
        return ResponseEntity.noContent().build();
    }

    // 카테고리에 아이템 추가
    @PostMapping("/categories/{categoryId}/items/{itemId}")
    public ResponseEntity<CategoryDTO> addItemToCategory(
            @PathVariable String categoryId,
            @PathVariable String itemId) {
        CategoryDTO updatedCategory = itemCategoryService.addItemToCategory(categoryId, itemId);
        return ResponseEntity.ok(updatedCategory);
    }
}