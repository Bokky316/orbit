package com.orbit.config.datainitializer;

import com.orbit.entity.item.Category;
import com.orbit.entity.item.Item;
import com.orbit.repository.item.CategoryRepository;
import com.orbit.repository.item.ItemRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ItemDataInitializer {

    private final CategoryRepository categoryRepo;
    private final ItemRepository itemRepo;
    private final ChildCodeRepository childCodeRepo;

    @PostConstruct
    @Transactional
    public void initItems() {
        if (categoryRepo.count() == 0) {
            List<Category> categories = createOfficeCategories();
            categoryRepo.saveAll(categories);
        }

        if (itemRepo.count() == 0) {
            List<Item> items = createOfficeItems(categoryRepo.findAll());
            itemRepo.saveAll(items);
        }
    }

    private List<Category> createOfficeCategories() {
        return List.of(
                Category.builder()
                        .id(UUID.randomUUID().toString().substring(0, 20))
                        .name("사무기기")
                        .description("프린터, 복합기 등 사무용 기기")
                        .useYn("Y")
                        .createdBy("system")
                        .build(),
                Category.builder()
                        .id(UUID.randomUUID().toString().substring(0, 20))
                        .name("문구류")
                        .description("필기구, 노트류 등")
                        .useYn("Y")
                        .createdBy("system")
                        .build(),
                Category.builder()
                        .id(UUID.randomUUID().toString().substring(0, 20))
                        .name("가구")
                        .description("책상, 의자 등")
                        .useYn("Y")
                        .createdBy("system")
                        .build(),
                Category.builder()
                        .id(UUID.randomUUID().toString().substring(0, 20))
                        .name("IT장비")
                        .description("컴퓨터, 모니터 등")
                        .useYn("Y")
                        .createdBy("system")
                        .build(),
                Category.builder()
                        .id(UUID.randomUUID().toString().substring(0, 20))
                        .name("소모품")
                        .description("토너, 용지 등 소모성 자재")
                        .useYn("Y")
                        .createdBy("system")
                        .build()
        );
    }

    private List<Item> createOfficeItems(List<Category> categories) {
        return List.of(
                createItem("A4 복사용지", "ITEM-1001", "EA", 15_000, categories.get(4)),
                createItem("검정 볼펜", "ITEM-1002", "EA", 500, categories.get(1)),
                createItem("사무용 의자", "ITEM-1003", "EA", 120_000, categories.get(2)),
                createItem("레이저 프린터", "ITEM-1004", "EA", 450_000, categories.get(0)),
                createItem("27인치 모니터", "ITEM-1005", "EA", 300_000, categories.get(3)),
                createItem("다용도 테이블", "ITEM-1006", "EA", 80_000, categories.get(2)),
                createItem("포스트잇", "ITEM-1007", "SET", 8_000, categories.get(1)),
                createItem("USB 메모리 64GB", "ITEM-1008", "EA", 15_000, categories.get(3)),
                createItem("토너 카트리지", "ITEM-1009", "BOX", 90_000, categories.get(4)),
                createItem("책상 정리함", "ITEM-1010", "EA", 25_000, categories.get(2))
        );
    }

    private Item createItem(String name, String code, String unit, int price, Category category) {
        return Item.builder()
                .id(UUID.randomUUID().toString().substring(0, 20))
                .category(category)
                .name(name)
                .code(code)
                .specification("표준 사양 적용")
                .unitChildCode(childCodeRepo.findByCodeValue(unit).orElseThrow(() -> new IllegalArgumentException("해당 단위 코드를 찾을 수 없습니다: " + unit)))
                .standardPrice(BigDecimal.valueOf(price))
                .description(name + " 상품 설명")
                .useYn("Y")
                .createdBy("system")
                .build();
    }
}
