package com.orbit.service.procurement;

import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.dto.procurement.PurchaseRequestItemDTO;
import com.orbit.dto.procurement.PurchaseRequestResponseDTO;
import com.orbit.entity.procurement.Item;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.procurement.PurchaseRequestItem;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.ItemRepository;
import com.orbit.repository.procurement.PurchaseRequestItemRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 구매 요청 관련 비즈니스 로직을 처리하는 서비스 클래스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseRequestService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final MemberRepository memberRepository;
    private final PurchaseRequestItemRepository purchaseRequestItemRepository;
    private final ItemRepository itemRepository;

    /**
     * 모든 구매 요청을 조회합니다.
     *
     * @return 구매 요청 목록
     */
    @Transactional(readOnly = true)
    public List<PurchaseRequestResponseDTO> getAllPurchaseRequests() {
        return purchaseRequestRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 구매 요청 ID로 구매 요청을 조회합니다.
     *
     * @param id 구매 요청 ID
     * @return 조회된 구매 요청 (Optional)
     */
    @Transactional(readOnly = true)
    public Optional<PurchaseRequestResponseDTO> getPurchaseRequestById(Long id) {
        return purchaseRequestRepository.findById(id)
                .map(this::convertToDto);
    }

    /**
     * 새로운 구매 요청을 생성합니다.
     *
     * @param purchaseRequestDTO 생성할 구매 요청 정보
     * @return 생성된 구매 요청
     */
    public PurchaseRequestResponseDTO createPurchaseRequest(PurchaseRequestDTO purchaseRequestDTO) {
        // 1. PurchaseRequestDTO -> PurchaseRequest 엔티티로 변환
        PurchaseRequest purchaseRequest = convertToEntity(purchaseRequestDTO);

        // 2. DB에 저장
        PurchaseRequest savedPurchaseRequest = purchaseRequestRepository.save(purchaseRequest);

        // 3. PurchaseRequestItemDTO 목록을 PurchaseRequestItem 엔티티 목록으로 변환 및 저장
        List<PurchaseRequestItem> purchaseRequestItems = new ArrayList<>();
        if (purchaseRequestDTO.getPurchaseRequestItemDTOs() != null) {
            purchaseRequestItems = purchaseRequestDTO.getPurchaseRequestItemDTOs().stream()
                    .map(itemDto -> convertToEntity(itemDto, savedPurchaseRequest))
                    .collect(Collectors.toList());
            purchaseRequestItemRepository.saveAll(purchaseRequestItems);
            savedPurchaseRequest.setPurchaseRequestItems(purchaseRequestItems);
        }

        return convertToDto(savedPurchaseRequest);
    }

    /**
     * 구매 요청 정보를 업데이트합니다.
     *
     * @param id               업데이트할 구매 요청 ID
     * @param purchaseRequestDTO 업데이트할 구매 요청 정보
     * @return 업데이트된 구매 요청
     * @throws EntityNotFoundException 구매 요청을 찾을 수 없을 경우
     */
    public PurchaseRequestResponseDTO updatePurchaseRequest(Long id, PurchaseRequestDTO purchaseRequestDTO) {
        // 1. ID로 기존 PurchaseRequest 엔티티 조회
        PurchaseRequest existingPurchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Purchase request not found with id: " + id));

        // 2. DTO에서 받은 값으로 기존 엔티티 업데이트
        updateEntity(existingPurchaseRequest, purchaseRequestDTO);

        // 3. 업데이트된 엔티티 DB에 저장
        PurchaseRequest updatedPurchaseRequest = purchaseRequestRepository.save(existingPurchaseRequest);

        return convertToDto(updatedPurchaseRequest);
    }

    /**
     * 구매 요청을 삭제합니다.
     *
     * @param id 삭제할 구매 요청 ID
     * @return 삭제 성공 여부
     */
    public boolean deletePurchaseRequest(Long id) {
        if (!purchaseRequestRepository.existsById(id)) {
            return false;
        }
        purchaseRequestRepository.deleteById(id);
        return true;
    }

    /**
     * PurchaseRequestDTO를 PurchaseRequest 엔티티로 변환합니다.
     *
     * @param dto 변환할 PurchaseRequestDTO 객체
     * @return 변환된 PurchaseRequest 엔티티 객체
     */
    private PurchaseRequest convertToEntity(PurchaseRequestDTO dto) {
        PurchaseRequest entity = new PurchaseRequest();
        entity.setRequestName(dto.getRequestName());
        entity.setRequestDate(dto.getRequestDate() != null ? dto.getRequestDate() : LocalDate.now()); // 요청일 기본값 설정
        entity.setCustomer(dto.getCustomer());
        entity.setBusinessDepartment(dto.getBusinessDepartment());
        entity.setBusinessManager(dto.getBusinessManager());
        entity.setBusinessType(dto.getBusinessType());
        entity.setBusinessBudget(dto.getBusinessBudget());
        entity.setSpecialNotes(dto.getSpecialNotes());
        entity.setManagerPhoneNumber(dto.getManagerPhoneNumber());
        entity.setProjectStartDate(dto.getProjectStartDate());
        entity.setProjectEndDate(dto.getProjectEndDate());
        entity.setProjectContent(dto.getProjectContent());
        entity.setAttachments(dto.getAttachments());

        return entity;
    }

    /**
     * PurchaseRequestItemDTO를 PurchaseRequestItem 엔티티로 변환합니다.
     *
     * @param itemDTO         변환할 PurchaseRequestItemDTO 객체
     * @param purchaseRequest PurchaseRequest 엔티티
     * @return 변환된 PurchaseRequestItem 엔티티 객체
     */
    private PurchaseRequestItem convertToEntity(PurchaseRequestItemDTO itemDTO, PurchaseRequest purchaseRequest) {
        PurchaseRequestItem entity = new PurchaseRequestItem();

        // Item 엔티티 조회
        Item item = itemRepository.findById(itemDTO.getItemId())
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + itemDTO.getItemId()));
        entity.setItem(item); // Item 엔티티 설정

        entity.setQuantity(itemDTO.getQuantity());
        entity.setUnitPrice(itemDTO.getUnitPrice());
        entity.setSupplyPrice(itemDTO.getSupplyPrice());
        entity.setVat(itemDTO.getVat());
        entity.setDeliveryRequestDate(itemDTO.getDeliveryRequestDate());
        entity.setDeliveryLocation(itemDTO.getDeliveryLocation());
        entity.setPurchaseRequest(purchaseRequest); // PurchaseRequest 설정

        return entity;
    }

    /**
     * PurchaseRequest 엔티티를 PurchaseRequestResponseDTO로 변환합니다.
     *
     * @param entity 변환할 PurchaseRequest 엔티티 객체
     * @return 변환된 PurchaseRequestResponseDTO 객체
     */
    private PurchaseRequestResponseDTO convertToDto(PurchaseRequest entity) {
        PurchaseRequestResponseDTO dto = new PurchaseRequestResponseDTO();
        dto.setId(entity.getId());
        dto.setRequestName(entity.getRequestName());
        dto.setRequestNumber(entity.getRequestNumber());
        dto.setRequestDate(entity.getRequestDate());
        dto.setCustomer(entity.getCustomer());
        dto.setBusinessDepartment(entity.getBusinessDepartment());
        dto.setBusinessManager(entity.getBusinessManager());
        dto.setBusinessType(entity.getBusinessType());
        dto.setBusinessBudget(entity.getBusinessBudget());
        dto.setSpecialNotes(entity.getSpecialNotes());
        dto.setManagerPhoneNumber(entity.getManagerPhoneNumber());
        dto.setProjectStartDate(entity.getProjectStartDate());
        dto.setProjectEndDate(entity.getProjectEndDate());
        dto.setProjectContent(entity.getProjectContent());
        dto.setAttachments(entity.getAttachments());

        return dto;
    }

    /**
     * PurchaseRequest 엔티티를 PurchaseRequestDTO에서 받은 정보로 업데이트합니다.
     *
     * @param entity 업데이트할 PurchaseRequest 엔티티 객체
     * @param dto    업데이트할 정보가 담긴 PurchaseRequestDTO 객체
     */
    private void updateEntity(PurchaseRequest entity, PurchaseRequestDTO dto) {
        entity.setRequestName(dto.getRequestName());
        entity.setRequestDate(dto.getRequestDate());
        entity.setCustomer(dto.getCustomer());
        entity.setBusinessDepartment(dto.getBusinessDepartment());
        entity.setBusinessManager(dto.getBusinessManager());
        entity.setBusinessType(dto.getBusinessType());
        entity.setBusinessBudget(dto.getBusinessBudget());
        entity.setSpecialNotes(dto.getSpecialNotes());
        entity.setManagerPhoneNumber(dto.getManagerPhoneNumber());
        entity.setProjectStartDate(dto.getProjectStartDate());
        entity.setProjectEndDate(dto.getProjectEndDate());
        entity.setProjectContent(dto.getProjectContent());
        entity.setAttachments(dto.getAttachments());
    }
}
