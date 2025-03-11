package com.orbit.config.datainitializer;

import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final ParentCodeRepository parentCodeRepo;
    private final ChildCodeRepository childCodeRepo;

    @PostConstruct
    @Transactional
    public void initCommonCodes() {
        // 1. ParentCode 조회 또는 생성
        ParentCode statusParent = parentCodeRepo.findByEntityTypeAndCodeGroup("PURCHASE_REQUEST", "STATUS")
                .orElseGet(() -> {  // Optional<ParentCode>에서 orElseGet 사용
                    ParentCode newParent = ParentCode.builder()
                            .entityType("PURCHASE_REQUEST")
                            .codeGroup("STATUS")
                            .codeName("구매 요청 상태")
                            .isActive(true)
                            .build();
                    return parentCodeRepo.save(newParent);
                });

        // 2. ChildCode 생성 (동일한 패턴 적용)
        createChildCodeIfMissing(statusParent, "REQUESTED", "요청됨", 1);
    }

    private void createChildCodeIfMissing(ParentCode parent, String codeValue, String codeName, int order) {
        childCodeRepo.findByParentCodeAndCodeValue(parent, codeValue)
                .orElseGet(() -> {  // Optional<ChildCode>에서 orElseGet 사용
                    ChildCode newChild = ChildCode.builder()
                            .parentCode(parent)
                            .codeValue(codeValue)
                            .codeName(codeName)
                            .displayOrder(order)
                            .isActive(true)
                            .build();
                    return childCodeRepo.save(newChild);
                });
    }
}
