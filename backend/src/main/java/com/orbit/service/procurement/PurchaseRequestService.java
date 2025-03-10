package com.orbit.service.procurement;

import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.dto.procurement.PurchaseRequestItemDTO;
import com.orbit.dto.procurement.PurchaseRequestResponseDTO;
import com.orbit.entity.procurement.Item;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.procurement.PurchaseRequestAttachment;
import com.orbit.entity.procurement.PurchaseRequestItem;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.ItemRepository;
import com.orbit.repository.procurement.PurchaseRequestAttachmentRepository;
import com.orbit.repository.procurement.PurchaseRequestItemRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 구매 요청 관련 비즈니스 로직 처리 (파일 업로드 기능 포함)
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
    private final PurchaseRequestAttachmentRepository attachmentRepository; // [추가] 첨부파일 Repository

    @Value("${uploadPath}") // WebConfig와 동일한 설정
    private String uploadPath;

    /**
     * 구매 요청 생성 (파일 업로드 포함)
     * @param purchaseRequestDTO 요청 정보
     * @param files 업로드 파일 배열 (nullable)
     */
    public PurchaseRequestResponseDTO createPurchaseRequest(
            PurchaseRequestDTO purchaseRequestDTO,
            MultipartFile[] files) {

        // 1. 엔티티 변환 (기존 로직)
        PurchaseRequest purchaseRequest = convertToEntity(purchaseRequestDTO);
        purchaseRequest.setRequestDate(LocalDate.now());

        // 2. 파일 처리 (신규 로직)
        if (files != null && files.length > 0) {
            processAttachments(purchaseRequest, files); // 첨부파일 처리
        }

        // 3. DB 저장
        PurchaseRequest savedPurchaseRequest = purchaseRequestRepository.save(purchaseRequest);

        // 4. 아이템 처리 (기존 로직)
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
     * 첨부파일 처리 메서드 (신규)
     * @param purchaseRequest 요청 엔티티
     * @param files 파일 배열
     */
    private void processAttachments(PurchaseRequest purchaseRequest, MultipartFile[] files) {
        for (MultipartFile file : files) {
            try {
                // 1. 파일 정보 추출 및 저장 경로 설정
                String fileName = StringUtils.cleanPath(file.getOriginalFilename());
                String filePath = uploadPath + "/pr_" + purchaseRequest.getId() + "/" + System.currentTimeMillis() + "_" + fileName;

                // 2. 디렉토리 생성 및 파일 저장
                Path targetLocation = Paths.get(filePath).toAbsolutePath().normalize();
                Files.createDirectories(targetLocation.getParent());
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                // 3. 첨부파일 엔티티 생성 및 저장
                PurchaseRequestAttachment attachment = new PurchaseRequestAttachment();
                attachment.setFileName(fileName);
                attachment.setFilePath(filePath);
                attachment.setFileType(file.getContentType());
                attachment.setFileSize(file.getSize());
                attachment.setPurchaseRequest(purchaseRequest); // 연관관계 설정

                attachmentRepository.save(attachment); // 첨부파일 DB에 저장

            } catch (IOException ex) {
                throw new RuntimeException("파일 저장 실패: " + ex.getMessage());
            }
        }
    }

    /**
     * 기존 엔티티 변환 로직 (수정)
     * @param dto 요청 DTO
     * @return PurchaseRequest 엔티티
     */
    private PurchaseRequest convertToEntity(PurchaseRequestDTO dto) {
        PurchaseRequest entity = new PurchaseRequest();
        entity.setRequestName(dto.getRequestName());
        entity.setRequestDate(dto.getRequestDate() != null ? dto.getRequestDate() : LocalDate.now());
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
        if(dto.getBusinessBudget() != null) {
            entity.setBusinessBudget(dto.getBusinessBudget());
        } else {
            entity.setBusinessBudget(BigDecimal.ZERO);
        }
        return entity;
    }

    /**
     * 기존 DTO 변환 로직 (수정)
     * @param entity PurchaseRequest 엔티티
     * @return PurchaseRequestResponseDTO 응답 DTO
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

        return dto;
    }

    /**
     * 기존 아이템 변환 로직 (수정 없음)
     * @param itemDTO 아이템 DTO
     * @param purchaseRequest 구매 요청 엔티티
     * @return PurchaseRequestItem 엔티티
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
     * 기존 update 로직 (수정 없음)
     * @param entity 업데이트 대상 엔티티
     * @param dto 요청 DTO
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
        // entity.setAttachments(dto.getAttachments()); // [삭제] 더 이상 사용 X
    }

    // [기존 로직 유지] ====================================================

    /**
     * 모든 구매 요청 조회
     * @return 구매 요청 목록
     */
    @Transactional(readOnly = true)
    public List<PurchaseRequestResponseDTO> getAllPurchaseRequests() {
        return purchaseRequestRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * ID로 구매 요청 조회
     * @param id 요청 ID
     * @return 구매 요청 (Optional)
     */
    @Transactional(readOnly = true)
    public Optional<PurchaseRequestResponseDTO> getPurchaseRequestById(Long id) {
        return purchaseRequestRepository.findById(id)
                .map(this::convertToDto);
    }

    /**
     * 구매 요청 정보 업데이트
     * @param id 업데이트 대상 ID
     * @param purchaseRequestDTO 업데이트 정보
     * @return 업데이트된 구매 요청
     * @throws EntityNotFoundException 해당 ID의 요청이 없을 경우
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
     * 구매 요청 삭제
     * @param id 삭제할 ID
     * @return 삭제 성공 여부
     */
    public boolean deletePurchaseRequest(Long id) {
        if (!purchaseRequestRepository.existsById(id)) {
            return false;
        }
        purchaseRequestRepository.deleteById(id);
        return true;
    }
}
