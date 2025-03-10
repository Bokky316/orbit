package com.orbit.service.procurement;

import com.orbit.dto.procurement.*;
import com.orbit.entity.procurement.*;
import com.orbit.entity.state.SystemStatus;
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
    private final PurchaseRequestAttachmentRepository attachmentRepository;

    @Value("${uploadPath}")
    private String uploadPath;

    /**
     * 구매 요청 생성 (파일 업로드 포함)
     * @param purchaseRequestDTO 요청 정보
     * @param files 업로드 파일 배열 (nullable)
     * @return 생성된 요청 DTO
     */
    /**
     * 구매 요청 생성 (파일 업로드 포함)
     * @param purchaseRequestDTO 요청 정보
     * @param files 업로드 파일 배열 (nullable)
     * @return 생성된 요청 DTO
     */
    public PurchaseRequestDTO createPurchaseRequest(
            PurchaseRequestDTO purchaseRequestDTO,
            MultipartFile[] files) {
        PurchaseRequest purchaseRequest = convertToEntity(purchaseRequestDTO);
        purchaseRequest.setRequestDate(LocalDate.now());
        PurchaseRequest savedPurchaseRequest = purchaseRequestRepository.save(purchaseRequest);

        if (files != null) {
            processAttachments(savedPurchaseRequest, files);
        }

        if (savedPurchaseRequest instanceof GoodsRequest && purchaseRequestDTO instanceof GoodsRequestDTO) {
            processGoodsRequestItems((GoodsRequest) savedPurchaseRequest, (GoodsRequestDTO) purchaseRequestDTO);
        }

        return convertToDto(savedPurchaseRequest);
    }

    /**
     * 첨부파일 처리
     * @param purchaseRequest 구매 요청 엔티티
     * @param files 파일 배열
     */
    private void processAttachments(PurchaseRequest purchaseRequest, MultipartFile[] files) {
        for (MultipartFile file : files) {
            try {
                // 파일명 정제 - 특수 문자 제거
                String fileName = StringUtils.cleanPath(file.getOriginalFilename())
                        .replaceAll("[^a-zA-Z0-9.-]", "_");  // 안전한 파일명으로 변경

                // 절대 경로 생성
                Path baseDir = Paths.get(uploadPath).toAbsolutePath();
                String subDir = "pr_" + purchaseRequest.getId();
                Path targetDir = baseDir.resolve(subDir);

                // 디렉토리 존재 확인 및 생성
                Files.createDirectories(targetDir);

                // 고유한 파일명 생성
                String uniqueFileName = System.currentTimeMillis() + "_" + fileName;
                Path targetPath = targetDir.resolve(uniqueFileName);

                // 파일 복사
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

                // 상대 경로로 저장 (백슬래시를 슬래시로 변경)
                String relativePath = Paths.get(subDir, uniqueFileName).toString().replace("\\", "/");

                PurchaseRequestAttachment attachment = PurchaseRequestAttachment.builder()
                        .fileName(fileName)
                        .filePath(relativePath)  // 상대 경로 사용
                        .fileType(file.getContentType())
                        .fileSize(file.getSize())
                        .purchaseRequest(purchaseRequest)
                        .build();

                attachmentRepository.save(attachment);

            } catch (IOException e) {
                log.error("파일 저장 실패: {}", e.getMessage(), e);
                throw new RuntimeException("파일 처리 중 오류 발생", e);
            }
        }
    }

    /**
     * GoodsRequest의 품목 정보 처리
     * @param goodsRequest GoodsRequest 엔티티
     * @param goodsRequestDTO GoodsRequestDTO
     */
    private void processGoodsRequestItems(GoodsRequest goodsRequest, GoodsRequestDTO goodsRequestDTO) {
        if (goodsRequestDTO.getItems() != null) {
            List<PurchaseRequestItem> items = goodsRequestDTO.getItems().stream()
                    .map(itemDto -> {
                        PurchaseRequestItem item = convertToItemEntity(itemDto, goodsRequest);
                        item.calculateTotalPrice(); // 총액 계산
                        return item;
                    })
                    .collect(Collectors.toList());
            purchaseRequestItemRepository.saveAll(items);
            goodsRequest.setItems(items);
        }
    }

    /**
     * DTO -> 엔티티 변환 (핵심: 타입별 필드 처리)
     * @param dto 요청 DTO
     * @return PurchaseRequest 엔티티
     */
    private PurchaseRequest convertToEntity(PurchaseRequestDTO dto) {
        PurchaseRequest purchaseRequest;

        switch (dto.getBusinessType()) {
            case "SI":
                purchaseRequest = new SIRequest();
                SIRequestDTO siDto = (SIRequestDTO) dto;
                ((SIRequest) purchaseRequest).setProjectStartDate(siDto.getProjectStartDate());
                ((SIRequest) purchaseRequest).setProjectEndDate(siDto.getProjectEndDate());
                ((SIRequest) purchaseRequest).setProjectContent(siDto.getProjectContent());
                break;
            case "MAINTENANCE":
                purchaseRequest = new MaintenanceRequest();
                MaintenanceRequestDTO maintenanceDto = (MaintenanceRequestDTO) dto;
                ((MaintenanceRequest) purchaseRequest).setContractStartDate(maintenanceDto.getContractStartDate());
                ((MaintenanceRequest) purchaseRequest).setContractEndDate(maintenanceDto.getContractEndDate());
                ((MaintenanceRequest) purchaseRequest).setContractAmount(maintenanceDto.getContractAmount());
                ((MaintenanceRequest) purchaseRequest).setContractDetails(maintenanceDto.getContractDetails());
                break;
            case "GOODS":
                purchaseRequest = new GoodsRequest();
                GoodsRequestDTO goodsDto = (GoodsRequestDTO) dto;
                List<PurchaseRequestItem> items = goodsDto.getItems().stream()
                        .map(this::convertToItemEntity)
                        .collect(Collectors.toList());
                ((GoodsRequest) purchaseRequest).setItems(items);
                break;
            default:
                throw new IllegalArgumentException("잘못된 Business Type: " + dto.getBusinessType());
        }

        purchaseRequest.setRequestName(dto.getRequestName());
        purchaseRequest.setCustomer(dto.getCustomer());
        purchaseRequest.setBusinessDepartment(dto.getBusinessDepartment());
        purchaseRequest.setBusinessManager(dto.getBusinessManager());
        purchaseRequest.setBusinessType(dto.getBusinessType());
        purchaseRequest.setBusinessBudget(dto.getBusinessBudget());
        purchaseRequest.setSpecialNotes(dto.getSpecialNotes());
        purchaseRequest.setManagerPhoneNumber(dto.getManagerPhoneNumber());

        // 상태 정보 설정 - 추가된 부분
        SystemStatus status = new SystemStatus();
        status.setParentCode("PURCHASE_REQUEST");
        status.setChildCode("REQUESTED");
        purchaseRequest.setStatus(status);

        return purchaseRequest;
    }

    private PurchaseRequestItem convertToItemEntity(PurchaseRequestItemDTO itemDto) {
        PurchaseRequestItem item = new PurchaseRequestItem();
        item.setItemName(itemDto.getItemName());
        item.setSpecification(itemDto.getSpecification());
        item.setUnit(itemDto.getUnit());
        item.setQuantity(itemDto.getQuantity());
        item.setUnitPrice(itemDto.getUnitPrice());
        item.setDeliveryRequestDate(itemDto.getDeliveryRequestDate());
        item.setDeliveryLocation(itemDto.getDeliveryLocation());
        return item;
    }


    /**
     * PurchaseRequestItemDTO -> PurchaseRequestItem 엔티티 변환
     * @param itemDTO PurchaseRequestItemDTO
     * @param goodsRequest GoodsRequest
     * @return PurchaseRequestItem
     */
    private PurchaseRequestItem convertToItemEntity(PurchaseRequestItemDTO itemDTO, GoodsRequest goodsRequest) {
        PurchaseRequestItem item = new PurchaseRequestItem();
        item.setItemName(itemDTO.getItemName());
        item.setSpecification(itemDTO.getSpecification());
        item.setUnit(itemDTO.getUnit());
        item.setQuantity(itemDTO.getQuantity());
        item.setUnitPrice(itemDTO.getUnitPrice());
        item.setDeliveryRequestDate(itemDTO.getDeliveryRequestDate());
        item.setDeliveryLocation(itemDTO.getDeliveryLocation());
        item.setGoodsRequest(goodsRequest);
        return item;
    }

    /**
     * 엔티티 -> DTO 변환 (핵심: 타입별 필드 추출)
     * @param entity PurchaseRequest 엔티티
     * @return PurchaseRequestDTO
     */
    private PurchaseRequestDTO convertToDto(PurchaseRequest entity) {
        PurchaseRequestDTO dto;

        // 타입별로 DTO 생성 및 필드 설정
        if (entity instanceof SIRequest) {
            dto = new SIRequestDTO();
            SIRequest siEntity = (SIRequest) entity;
            ((SIRequestDTO) dto).setProjectStartDate(siEntity.getProjectStartDate());
            ((SIRequestDTO) dto).setProjectEndDate(siEntity.getProjectEndDate());
            ((SIRequestDTO) dto).setProjectContent(siEntity.getProjectContent());
        } else if (entity instanceof MaintenanceRequest) {
            dto = new MaintenanceRequestDTO();
            MaintenanceRequest maintenanceEntity = (MaintenanceRequest) entity;
            ((MaintenanceRequestDTO) dto).setContractStartDate(maintenanceEntity.getContractStartDate());
            ((MaintenanceRequestDTO) dto).setContractEndDate(maintenanceEntity.getContractEndDate());
            ((MaintenanceRequestDTO) dto).setContractAmount(maintenanceEntity.getContractAmount());
            ((MaintenanceRequestDTO) dto).setContractDetails(maintenanceEntity.getContractDetails());
        } else if (entity instanceof GoodsRequest) {
            dto = new GoodsRequestDTO();
            GoodsRequest goodsEntity = (GoodsRequest) entity;
            ((GoodsRequestDTO) dto).setItems(goodsEntity.getItems().stream()
                    .map(this::convertToItemDto)
                    .collect(Collectors.toList()));
        } else {
            throw new IllegalArgumentException("잘못된 PurchaseRequest 타입");
        }

        // 공통 속성 설정
        dto.setId(entity.getId());
        dto.setRequestName(entity.getRequestName());
        dto.setRequestNumber(entity.getRequestNumber());

        // status가 null이 아닌 경우에만 toString() 호출 - NPE 방지
        if (entity.getStatus() != null) {
            dto.setStatus(entity.getStatus().getFullCode());
        } else {
            dto.setStatus("PURCHASE_REQUEST-REQUESTED"); // 기본값 설정
        }
        dto.setStatus(entity.getStatus().toString()); // Enum 값 문자열로 변환
        dto.setRequestDate(entity.getRequestDate());
        dto.setCustomer(entity.getCustomer());
        dto.setBusinessDepartment(entity.getBusinessDepartment());
        dto.setBusinessManager(entity.getBusinessManager());
        dto.setBusinessType(entity.getBusinessType());
        dto.setBusinessBudget(entity.getBusinessBudget());
        dto.setSpecialNotes(entity.getSpecialNotes());
        dto.setManagerPhoneNumber(entity.getManagerPhoneNumber());

        // 첨부 파일 설정
        if (entity.getAttachments() != null && !entity.getAttachments().isEmpty()) {
            dto.setAttachments(entity.getAttachments().stream()
                    .map(this::convertAttachmentToDto)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    /**
     * PurchaseRequestAttachment -> PurchaseRequestAttachmentDTO 변환
     * @param attachment PurchaseRequestAttachment 엔티티
     * @return PurchaseRequestAttachmentDTO
     */
    private PurchaseRequestAttachmentDTO convertAttachmentToDto(PurchaseRequestAttachment attachment) {
        return PurchaseRequestAttachmentDTO.builder()
                .fileName(attachment.getFileName())
                .filePath(attachment.getFilePath())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .build();
    }

    /**
     * PurchaseRequestItem -> PurchaseRequestItemDTO 변환
     * @param item PurchaseRequestItem 엔티티
     * @return PurchaseRequestItemDTO
     */
    private PurchaseRequestItemDTO convertToItemDto(PurchaseRequestItem item) {
        PurchaseRequestItemDTO itemDto = new PurchaseRequestItemDTO();
        itemDto.setId(item.getId());
        itemDto.setItemName(item.getItemName());
        itemDto.setSpecification(item.getSpecification());
        itemDto.setUnit(item.getUnit());
        itemDto.setQuantity(item.getQuantity());
        itemDto.setUnitPrice(item.getUnitPrice());

        // 총액 계산 (단가 * 수량)
        if (item.getQuantity() != null && item.getUnitPrice() != null) {
            BigDecimal totalPrice = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            itemDto.setTotalPrice(totalPrice);
        } else {
            itemDto.setTotalPrice(BigDecimal.ZERO);
        }

        itemDto.setDeliveryRequestDate(item.getDeliveryRequestDate());
        itemDto.setDeliveryLocation(item.getDeliveryLocation());

        return itemDto;
    }

    // [기존 로직 유지] ====================================================

    /**
     * 모든 구매 요청 조회
     * @return 구매 요청 목록
     */
    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> getAllPurchaseRequests() {
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
    public Optional<PurchaseRequestDTO> getPurchaseRequestById(Long id) {
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
    public PurchaseRequestDTO updatePurchaseRequest(Long id, PurchaseRequestDTO purchaseRequestDTO) {
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
//        entity.setProjectStartDate(dto.getProjectStartDate());
//        entity.setProjectEndDate(dto.getProjectEndDate());
//        entity.setProjectContent(dto.getProjectContent());
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

    /**
     * 기존 구매 요청에 첨부 파일 추가
     * @param id 구매 요청 ID
     * @param files 추가할 파일 배열
     * @return 업데이트된 구매 요청 DTO
     */
    public PurchaseRequestDTO addAttachmentsToPurchaseRequest(Long id, MultipartFile[] files) {
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Purchase request not found with id: " + id));

        if (files != null && files.length > 0) {
            processAttachments(purchaseRequest, files);
        }

        return convertToDto(purchaseRequest);
    }
}
