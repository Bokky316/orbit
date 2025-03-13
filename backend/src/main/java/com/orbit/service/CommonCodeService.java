package com.orbit.service;

import com.orbit.dto.commonCode.CommonCodeDTO;
import com.orbit.dto.commonCode.CommonCodeGroupDTO;
import com.orbit.entity.commonCode.CommonCode;
import com.orbit.entity.commonCode.CommonCodeGroup;
import com.orbit.repository.commonCode.CommonCodeGroupRepository;
import com.orbit.repository.commonCode.CommonCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommonCodeService {

    private final CommonCodeRepository codeRepository;
    private final CommonCodeGroupRepository codeGroupRepository;

    /**
     * 모든 코드 그룹 조회
     */
    public List<CommonCodeGroupDTO> getAllCodeGroups() {
        return codeGroupRepository.findAll().stream()
                .map(CommonCodeGroupDTO::from)  // 정적 팩토리 메소드 사용
                .collect(Collectors.toList());
    }

    /**
     * 활성화된 코드 그룹만 조회
     */
    public List<CommonCodeGroupDTO> getActiveCodeGroups() {
        return codeGroupRepository.findAllActive().stream()
                .map(CommonCodeGroupDTO::from)  // 정적 팩토리 메소드 사용
                .collect(Collectors.toList());
    }

    /**
     * 코드 그룹 상세 조회 (하위 코드 포함)
     */
    public CommonCodeGroupDTO getCodeGroupWithCodes(String groupId) {
        CommonCodeGroup group = codeGroupRepository.findByIdWithCodes(groupId)
                .orElseThrow(() -> new IllegalArgumentException("해당 코드 그룹이 존재하지 않습니다: " + groupId));

        CommonCodeGroupDTO dto = CommonCodeGroupDTO.from(group);  // 정적 팩토리 메소드 사용
        dto.setCodes(group.getCodes().stream()
                .map(CommonCodeDTO::from)  // 정적 팩토리 메소드 사용
                .collect(Collectors.toList()));

        return dto;
    }

    /**
     * 그룹 ID로 코드 목록 조회
     */
    public List<CommonCodeDTO> getCodesByGroupId(String groupId) {
        return codeRepository.findByGroupIdOrderBySortOrderAsc(groupId).stream()
                .map(CommonCodeDTO::from)  // 정적 팩토리 메소드 사용
                .collect(Collectors.toList());
    }

    /**
     * 활성화된 코드만 그룹 ID로 조회
     */
    public List<CommonCodeDTO> getActiveCodesByGroupId(String groupId) {
        return codeRepository.findActiveCodesByGroupId(groupId).stream()
                .map(CommonCodeDTO::from)  // 정적 팩토리 메소드 사용
                .collect(Collectors.toList());
    }

    /**
     * 코드 상세 조회
     */
    public CommonCodeDTO getCodeById(String codeId) {
        CommonCode code = codeRepository.findByIdWithGroup(codeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 코드가 존재하지 않습니다: " + codeId));

        return CommonCodeDTO.from(code);  // 정적 팩토리 메소드 사용
    }

    /**
     * CommonCodeGroup 엔티티를 DTO로 변환
     */
    private CommonCodeGroupDTO toCodeGroupDTO(CommonCodeGroup entity) {
        if (entity == null) return null;

        CommonCodeGroupDTO dto = new CommonCodeGroupDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setUseYn(entity.getUseYn());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    /**
     * CommonCode 엔티티를 DTO로 변환
     */
    private CommonCodeDTO toCodeDTO(CommonCode entity) {
        if (entity == null) return null;

        CommonCodeDTO dto = new CommonCodeDTO();
        dto.setId(entity.getId());
        dto.setGroupId(entity.getGroup() != null ? entity.getGroup().getId() : null);
        dto.setGroupName(entity.getGroup() != null ? entity.getGroup().getName() : null);
        dto.setName(entity.getName());
        dto.setValue(entity.getValue());
        dto.setSortOrder(entity.getSortOrder());
        dto.setDescription(entity.getDescription());
        dto.setUseYn(entity.getUseYn());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
