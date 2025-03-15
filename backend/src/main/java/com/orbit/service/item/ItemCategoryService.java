package com.orbit.service.item;

import com.orbit.dto.item.CategoryDTO;
import com.orbit.dto.item.ItemDTO;
import com.orbit.entity.item.Category;
import com.orbit.entity.item.Item;
import com.orbit.repository.item.CategoryRepository;
import com.orbit.repository.item.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemCategoryService {
    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;

    // 카테고리 관련 메서드
    @Transactional
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        if (categoryRepository.existsByName(categoryDTO.getName())) {
            throw new IllegalArgumentException("이미 존재하는 카테고리 이름입니다.");
        }

        Category category = Category.builder()
                .id(categoryDTO.getId())
                .name(categoryDTO.getName())
                .description(categoryDTO.getDescription())
                .build();

        return CategoryDTO.from(categoryRepository.save(category));
    }

    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllActiveCategories() {
        return categoryRepository.findAllActive().stream()
                .map(CategoryDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDTO getCategoryWithItems(String categoryId) {
        Category category = categoryRepository.findByIdWithItems(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("해당 카테고리를 찾을 수 없습니다."));

        CategoryDTO categoryDTO = CategoryDTO.from(category);
        categoryDTO.setItems(
                category.getItems().stream()
                        .map(ItemDTO::from)
                        .collect(Collectors.toList())
        );

        return categoryDTO;
    }

    @Transactional
    public CategoryDTO updateCategory(CategoryDTO categoryDTO) {
        Category category = categoryRepository.findById(categoryDTO.getId())
                .orElseThrow(() -> new IllegalArgumentException("해당 카테고리를 찾을 수 없습니다."));

        if (!category.getName().equals(categoryDTO.getName())
                && categoryRepository.existsByName(categoryDTO.getName())) {
            throw new IllegalArgumentException("이미 존재하는 카테고리 이름입니다.");
        }

        category.setName(categoryDTO.getName());
        category.setDescription(categoryDTO.getDescription());
        category.setUseYn(categoryDTO.getUseYn());

        return CategoryDTO.from(categoryRepository.save(category));
    }

    @Transactional
    public void deactivateCategory(String categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("해당 카테고리를 찾을 수 없습니다."));

        category.setUseYn("N");
        categoryRepository.save(category);
    }

    // 아이템 관련 메서드
    @Transactional
    public ItemDTO createItem(ItemDTO itemDTO) {
        if (itemRepository.existsByCode(itemDTO.getCode())) {
            throw new IllegalArgumentException("이미 존재하는 아이템 코드입니다.");
        }

        Category category = categoryRepository.findById(itemDTO.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 카테고리입니다."));

        Item item = Item.builder()
                .id(itemDTO.getId())
                .category(category)
                .name(itemDTO.getName())
                .code(itemDTO.getCode())
                .specification(itemDTO.getSpecification())
                .standardPrice(itemDTO.getStandardPrice())
                .description(itemDTO.getDescription())
                .build();

        return ItemDTO.from(itemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<ItemDTO> getAllActiveItems() {
        return itemRepository.findAllActive().stream()
                .map(ItemDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ItemDTO> getActiveByCategoryId(String categoryId) {
        return itemRepository.findActiveByCategoryId(categoryId).stream()
                .map(ItemDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ItemDTO updateItem(ItemDTO itemDTO) {
        Item item = itemRepository.findById(itemDTO.getId())
                .orElseThrow(() -> new IllegalArgumentException("해당 아이템을 찾을 수 없습니다."));

        if (!item.getCategory().getId().equals(itemDTO.getCategoryId())) {
            Category newCategory = categoryRepository.findById(itemDTO.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 카테고리입니다."));
            item.setCategory(newCategory);
        }

        item.setName(itemDTO.getName());
        item.setSpecification(itemDTO.getSpecification());
        item.setStandardPrice(itemDTO.getStandardPrice());
        item.setDescription(itemDTO.getDescription());
        item.setUseYn(itemDTO.getUseYn());

        return ItemDTO.from(itemRepository.save(item));
    }

    @Transactional
    public void deactivateItem(String itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 아이템을 찾을 수 없습니다."));

        item.setUseYn("N");
        itemRepository.save(item);
    }

    // 카테고리에 아이템 추가 메서드
    @Transactional
    public CategoryDTO addItemToCategory(String categoryId, String itemId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("해당 카테고리를 찾을 수 없습니다."));

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 아이템을 찾을 수 없습니다."));

        category.addItem(item);
        categoryRepository.save(category);

        return getCategoryWithItems(categoryId);
    }
}