package com.orbit.service.procurement;

import com.orbit.dto.approval.PositionDTO;
import com.orbit.entity.approval.Position;
import com.orbit.exception.DuplicateResourceException;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.approval.PositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PositionService {

    private final PositionRepository positionRepository;

    /**
     * 모든 직급 조회
     */
    @Transactional(readOnly = true)
    public List<PositionDTO> getAllPositions() {
        return positionRepository.findAllByOrderByLevelAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 직급 ID로 단일 직급 조회
     */
    @Transactional(readOnly = true)
    public PositionDTO getPositionById(Long id) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("직급을 찾을 수 없습니다. ID: " + id));
        return convertToDTO(position);
    }

    /**
     * 특정 레벨 이상의 직급 조회
     */
    @Transactional(readOnly = true)
    public List<PositionDTO> getPositionsByMinLevel(int minLevel) {
        return positionRepository.findByLevelGreaterThanEqual(minLevel).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 직급 생성
     */
    public PositionDTO createPosition(PositionDTO dto) {
        // 직급명 중복 검사
        if (positionRepository.existsByName(dto.getName())) {
            throw new DuplicateResourceException("이미 존재하는 직급명입니다: " + dto.getName());
        }

        Position position = Position.builder()
                .name(dto.getName())
                .level(dto.getLevel())
                .description(dto.getDescription())
                .build();

        Position savedPosition = positionRepository.save(position);
        return convertToDTO(savedPosition);
    }

    /**
     * 직급 정보 수정
     */
    public PositionDTO updatePosition(Long id, PositionDTO dto) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("직급을 찾을 수 없습니다. ID: " + id));

        // 다른 직급과 이름 중복 검사 (같은 ID는 제외)
        if (!position.getName().equals(dto.getName()) && positionRepository.existsByName(dto.getName())) {
            throw new DuplicateResourceException("이미 존재하는 직급명입니다: " + dto.getName());
        }

        // 직급 정보 업데이트
        position.setName(dto.getName());
        position.setLevel(dto.getLevel());
        position.setDescription(dto.getDescription());

        Position updatedPosition = positionRepository.save(position);
        return convertToDTO(updatedPosition);
    }

    /**
     * 직급 삭제
     */
    public void deletePosition(Long id) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("직급을 찾을 수 없습니다. ID: " + id));

        // 직급에 소속된 멤버가 있는지 확인 (안전 장치)
        if (!position.getMembers().isEmpty()) {
            throw new IllegalStateException("소속 멤버가 있는 직급은 삭제할 수 없습니다. 직급 ID: " + id);
        }

        positionRepository.delete(position);
    }

    /**
     * 직급 엔티티를 DTO로 변환
     */
    private PositionDTO convertToDTO(Position position) {
        return PositionDTO.builder()
                .id(position.getId())
                .name(position.getName())
                .level(position.getLevel())
                .description(position.getDescription())
                .build();
    }
}