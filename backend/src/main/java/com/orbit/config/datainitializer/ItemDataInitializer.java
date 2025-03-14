package com.orbit.config.datainitializer;

import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.item.Category;
import com.orbit.entity.item.Item;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.item.CategoryRepository;
import com.orbit.repository.item.ItemRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(2) // CommonCodeDataInitializer 이후 실행되도록 순서 지정
public class ItemDataInitializer {

    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final ChildCodeRepository childCodeRepository;
    private final ParentCodeRepository parentCodeRepository;

    @PostConstruct
    @Transactional
    public void initData() {
        // 카테고리 및 아이템이 이미 존재하는지 확인
        if (categoryRepository.count() > 0 || itemRepository.count() > 0) {
            log.info("카테고리 또는 아이템이 이미 존재합니다. 초기화를 중단합니다.");
            return; // 이미 데이터가 있으면 초기화 중단
        }

        // 단위 코드가 존재하는지 확인
        ParentCode unitParentCode = getUnitParentCode();
        if (unitParentCode == null) {
            log.error("단위 코드가 초기화되지 않았습니다. 아이템 초기화를 중단합니다.");
            return;
        }

        log.info("단위 ParentCode를 찾았습니다: {}", unitParentCode.getCodeName());

        // 단위 코드의 자식 코드 확인 (디버깅 용도)
        List<ChildCode> unitChildCodes = childCodeRepository.findByParentCode(unitParentCode);
        log.info("단위 코드 하위 ChildCode 개수: {}", unitChildCodes.size());
        unitChildCodes.forEach(code -> log.info("ChildCode: {} ({})", code.getCodeValue(), code.getCodeName()));

        try {
            // 카테고리 생성 및 저장
            List<Category> categories = createCategories();
            categoryRepository.saveAll(categories);
            log.info("카테고리 {}개가 생성되었습니다.", categories.size());

            // 아이템 생성 및 저장
            createAndSaveItems(categories, unitParentCode);
            log.info("아이템이 성공적으로 생성되었습니다.");
        } catch (Exception e) {
            log.error("데이터 초기화 중 오류 발생: {}", e.getMessage(), e);
        }
    }

    private ParentCode getUnitParentCode() {
        // CommonCodeDataInitializer에 맞춰서 "ITEM"과 "UNIT"으로 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("ITEM", "UNIT");
        if (parentCode.isPresent()) {
            return parentCode.get();
        }

        // 기존 방식인 "단위"라는 이름으로도 찾아보기 (호환성)
        ParentCode oldStyleCode = parentCodeRepository.findByCodeName("단위");
        return oldStyleCode;
    }

    private List<Category> createCategories() {
        return Arrays.asList(
                createCategory("사무기기", "프린터, 복합기 등 사무용 기기"),
                createCategory("문구류", "필기구, 노트류 등 사무용 문구"),
                createCategory("가구", "책상, 의자, 수납장 등 사무용 가구"),
                createCategory("IT장비", "컴퓨터, 모니터, 네트워크 장비 등"),
                createCategory("소모품", "토너, 용지 등 일회성 소모성 자재")
        );
    }

    private Category createCategory(String name, String description) {
        return Category.builder()
                .id(generateId())
                .name(name)
                .description(description)
                .useYn("Y")
                .createdBy("system")
                .build();
    }

    private void createAndSaveItems(List<Category> categories, ParentCode unitParentCode) {
        // 사무기기 카테고리 아이템
        Category officeEquipmentCategory = categories.get(0);
        itemRepository.saveAll(Arrays.asList(
                createItem(officeEquipmentCategory, "레이저 프린터", "PRINTER001", "고성능 흑백 레이저 프린터",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("450000")),
                createItem(officeEquipmentCategory, "복합기", "MULTIDEV001", "인쇄/스캔/복사 올인원 복합기",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("750000")),
                createItem(officeEquipmentCategory, "문서 스캐너", "SCANNER001", "고속 문서 스캐너",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("350000"))
        ));

        // 문구류 카테고리 아이템
        Category stationeryCategory = categories.get(1);
        itemRepository.saveAll(Arrays.asList(
                createItem(stationeryCategory, "검정 볼펜", "PEN001", "0.5mm 유성 볼펜",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("500")),
                createItem(stationeryCategory, "포스트잇", "POSTIT001", "76x76mm 접착식 메모지 400매",
                        findChildCodeSafely(unitParentCode, "SET"), new BigDecimal("8000")),
                createItem(stationeryCategory, "노트", "NOTE001", "A5 스프링 노트",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("3500"))
        ));

        // 가구 카테고리 아이템
        Category furnitureCategory = categories.get(2);
        itemRepository.saveAll(Arrays.asList(
                createItem(furnitureCategory, "사무용 의자", "CHAIR001", "메쉬 등받이 기능성 사무용 의자",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("120000")),
                createItem(furnitureCategory, "책상", "DESK001", "1600x800 사무용 책상",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("200000")),
                createItem(furnitureCategory, "책장", "SHELF001", "5단 오픈형 책장",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("150000"))
        ));

        // IT장비 카테고리 아이템
        Category itEquipmentCategory = categories.get(3);
        itemRepository.saveAll(Arrays.asList(
                createItem(itEquipmentCategory, "노트북", "LAPTOP001", "업무용 고성능 노트북",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("1500000")),
                createItem(itEquipmentCategory, "27인치 모니터", "MONITOR001", "27인치 IPS 패널 모니터",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("300000")),
                createItem(itEquipmentCategory, "USB 메모리", "USB001", "64GB USB 3.0 메모리",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("15000"))
        ));

        // 소모품 카테고리 아이템
        Category consumablesCategory = categories.get(4);
        itemRepository.saveAll(Arrays.asList(
                createItem(consumablesCategory, "A4 복사용지", "PAPER001", "A4 80g 500매",
                        findChildCodeSafely(unitParentCode, "BOX"), new BigDecimal("15000")),
                createItem(consumablesCategory, "토너 카트리지", "TONER001", "레이저 프린터용 토너",
                        findChildCodeSafely(unitParentCode, "EA"), new BigDecimal("90000")),
                createItem(consumablesCategory, "클립", "CLIP001", "33mm 금속 클립 100개입",
                        findChildCodeSafely(unitParentCode, "BOX"), new BigDecimal("3000"))
        ));
    }

    private Item createItem(Category category, String name, String code, String specification,
                            ChildCode unitChildCode, BigDecimal price) {
        return Item.builder()
                .id(generateId())
                .category(category)
                .name(name)
                .code(code)
                .specification(specification)
                .unitChildCode(unitChildCode)
                .unitParentCode(unitChildCode.getParentCode())
                .standardPrice(price)
                .description(name + " - " + specification)
                .useYn("Y")
                .createdBy("system")
                .build();
    }

    private ChildCode findChildCodeSafely(ParentCode parentCode, String codeValue) {
        Optional<ChildCode> childCode = childCodeRepository.findByParentCodeAndCodeValue(parentCode, codeValue);

        if (childCode.isPresent()) {
            return childCode.get();
        } else {
            // 원하는 코드가 없으면 해당 부모 코드의 첫 번째 자식 코드 반환
            List<ChildCode> childCodes = childCodeRepository.findByParentCode(parentCode);
            if (!childCodes.isEmpty()) {
                log.warn("코드 '{}' 를 찾지 못해 첫 번째 자식 코드 {} 를 사용합니다.", codeValue, childCodes.get(0).getCodeValue());
                return childCodes.get(0);
            }

            // 자식 코드가 없으면 새로 생성
            log.warn("부모 코드 {} 에 자식 코드가 없어 {} 코드를 생성합니다.", parentCode.getCodeName(), codeValue);
            ChildCode newChildCode = ChildCode.builder()
                    .parentCode(parentCode)
                    .codeValue(codeValue)
                    .codeName(codeValue.equals("EA") ? "개" : codeValue)
                    .isActive(true)
                    .build();
            return childCodeRepository.save(newChildCode);
        }
    }

    private String generateId() {
        return UUID.randomUUID().toString().substring(0, 20);
    }
}