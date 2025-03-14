package com.orbit.service.commonCode;

import com.orbit.dto.commonCode.ChildCodeDTO;
import com.orbit.dto.commonCode.ParentCodeDTO;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 공통 코드 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommonCodeService {

    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;

    /**
     * 특정 entityType, codeGroup에 해당하는 자식 코드 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ChildCodeDTO> getChildCodesByTypeAndGroup(String entityType, String codeGroup) {
        // 1. 부모 코드 조회
        ParentCode parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup(entityType, codeGroup)
                .orElse(null);

        if (parentCode == null) {
            return new ArrayList<>();
        }

        // 2. 자식 코드 목록 조회 및 DTO 변환
        return childCodeRepository.findByParentCodeAndIsActiveTrue(parentCode).stream()
                .map(this::convertToChildCodeDTO)
                .collect(Collectors.toList());
    }

    /**
     * 모든 공통 코드 조회 (타입별 그룹화)
     */
    @Transactional(readOnly = true)
    public List<Object> getAllCommonCodes() {
        List<ParentCode> parentCodes = parentCodeRepository.findByIsActiveTrue();

        // entityType별로 그룹화
        Map<String, List<ParentCodeDTO>> groupedByEntityType = parentCodes.stream()
                .map(this::convertToParentCodeDTO)
                .collect(Collectors.groupingBy(ParentCodeDTO::getEntityType));

        // 결과 처리
        List<Object> result = new ArrayList<>();
        groupedByEntityType.forEach((entityType, parentCodeList) -> {
            Map<String, Object> entityTypeMap = Map.of(
                    "entityType", entityType,
                    "parentCodes", parentCodeList
            );
            result.add(entityTypeMap);
        });

        return result;
    }

    /**
     * ParentCode 엔티티를 DTO로 변환
     */
    private ParentCodeDTO convertToParentCodeDTO(ParentCode parentCode) {
        List<ChildCodeDTO> childCodes = childCodeRepository.findByParentCodeAndIsActiveTrue(parentCode).stream()
                .map(this::convertToChildCodeDTO)
                .collect(Collectors.toList());

        return ParentCodeDTO.builder()
                .id(parentCode.getId())
                .entityType(parentCode.getEntityType())
                .codeGroup(parentCode.getCodeGroup())
                .codeName(parentCode.getCodeName())
                .childCodes(childCodes)
                .build();
    }

    /**
     * ChildCode 엔티티를 DTO로 변환
     */
    private ChildCodeDTO convertToChildCodeDTO(ChildCode childCode) {
        return ChildCodeDTO.builder()
                .id(childCode.getId())
                .parentCodeId(childCode.getParentCode().getId())
                .codeValue(childCode.getCodeValue())
                .codeName(childCode.getCodeName())
                .build();
    }
}