// PurchaseRequestService.java
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
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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

    /**
     * 구매요청 생성/수정 시 종합적인 유효성 검증
     */
    private void validatePurchaseRequest(PurchaseRequest request) {
        // 1. 기본 필드 검증
        validateBasicFields(request);

        // 2. 날짜 유효성 검증
        validateDates(request);

        // 3. 예산 유효성 검증
        validateBudget(request);

        // 4. 프로젝트 연관관계 검증
        if (request.getProject() != null) {
            validatePurchaseRequestWithProject(request, request.getProject());
        }

        // 5. 요청 타입별 추가 검증
        if (request instanceof GoodsRequest) {
            validateGoodsRequest((GoodsRequest) request);
        } else if (request instanceof SIRequest) {
            validateSIRequest((SIRequest) request);
        } else if (request instanceof MaintenanceRequest) {
            validateMaintenanceRequest((MaintenanceRequest) request);
        }
    }

    /**
     * 기본 필드 유효성 검증
     */
    private void validateBasicFields(PurchaseRequest request) {
        // 필수 필드 검증
        if (StringUtils.isEmpty(request.getRequestName())) {
            throw new IllegalArgumentException("구매요청명은 필수입니다.");
        }

        if (StringUtils.isEmpty(request.getBusinessType())) {
            throw new IllegalArgumentException("사업 구분은 필수입니다.");
        }

        // 연락처 형식 검증
        if (request.getManagerPhoneNumber() != null && !request.getManagerPhoneNumber().matches("^01[0-9]{8,9}$")) {
            throw new IllegalArgumentException("유효하지 않은 핸드폰 번호 형식입니다.");
        }
    }

    /**
     * 날짜 유효성 검증
     */
    private void validateDates(PurchaseRequest request) {
        LocalDate startDate = null;
        LocalDate endDate = null;

        // 요청 유형에 따라 날짜 필드 가져오기
        if (request instanceof SIRequest) {
            SIRequest siRequest = (SIRequest) request;
            startDate = siRequest.getProjectStartDate();
            endDate = siRequest.getProjectEndDate();
        } else if (request instanceof MaintenanceRequest) {
            MaintenanceRequest maintenanceRequest = (MaintenanceRequest) request;
            startDate = maintenanceRequest.getContractStartDate();
            endDate = maintenanceRequest.getContractEndDate();
        }

        // 날짜 검증
        if (startDate != null && endDate != null) {
            // 시작일이 종료일보다 앞에 있어야 함
            if (startDate.isAfter(endDate)) {
                throw new IllegalArgumentException("시작일이 종료일보다 늦을 수 없습니다.");
            }

            // 시작일이 현재 또는 미래 날짜인지 검증 (선택 사항)
            LocalDate today = LocalDate.now();
            if (startDate.isBefore(today)) {
                log.warn("구매요청 시작일이 과거 날짜입니다: {}", startDate);
                // 경고만 하거나 예외 발생 가능
                // throw new IllegalArgumentException("시작일은 오늘 이후 날짜여야 합니다.");
            }
        }
    }

    /**
     * 예산 유효성 검증
     */
    private void validateBudget(PurchaseRequest request) {
        BigDecimal budget = request.getBusinessBudget();

        // 예산이 음수가 아닌지 확인
        if (budget != null && budget.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("사업 예산은 0 이상이어야 합니다.");
        }

        // 물품 요청인 경우 품목 가격의 합과 비교
        if (request instanceof GoodsRequest) {
            GoodsRequest goodsRequest = (GoodsRequest) request;

            if (goodsRequest.getItems() != null && !goodsRequest.getItems().isEmpty()) {
                BigDecimal totalItemsPrice = goodsRequest.getItems().stream()
                        .map(PurchaseRequestItem::getTotalPrice)
                        .filter(price -> price != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                // 예산이 물품 가격 합계와 일치하는지 확인
                if (budget != null && totalItemsPrice.compareTo(budget) != 0) {
                    log.warn("구매요청 예산({})과 물품 가격 합계({})가 일치하지 않습니다",
                            budget, totalItemsPrice);

                    // 자동으로 예산 맞추기 (선택 사항)
                    // request.setBusinessBudget(totalItemsPrice);

                    // 또는 예외 발생
                    // throw new IllegalArgumentException(
                    //    "구매요청 예산과 물품 가격 합계가 일치해야 합니다.");
                }
            }
        }
    }

    /**
     * GoodsRequest 타입별 추가 검증
     */
    private void validateGoodsRequest(GoodsRequest request) {
        // 품목 존재 여부 확인
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("물품 요청에는 최소 하나 이상의 품목이 필요합니다.");
        }

        // 각 품목 유효성 검증
        for (PurchaseRequestItem item : request.getItems()) {
            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new IllegalArgumentException("품목 수량은 0보다 커야 합니다.");
            }

            if (item.getUnitPrice() == null || item.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("품목 단가는 0보다 커야 합니다.");
            }

            // 배송 요청 날짜가 과거인지 확인
            if (item.getDeliveryRequestDate() != null &&
                    item.getDeliveryRequestDate().isBefore(LocalDate.now())) {
                log.warn("품목의 배송 요청일이 과거 날짜입니다: {}", item.getDeliveryRequestDate());
                // 경고만 하거나 예외 발생 가능
            }
        }
    }

    /**
     * SIRequest 타입별 추가 검증
     */
    private void validateSIRequest(SIRequest request) {
        // SI 요청에 필요한 필수 필드 검증
        if (request.getProjectStartDate() == null || request.getProjectEndDate() == null) {
            throw new IllegalArgumentException("SI 프로젝트의 시작일과 종료일은 필수입니다.");
        }

        if (StringUtils.isEmpty(request.getProjectContent())) {
            throw new IllegalArgumentException("SI 프로젝트 내용은 필수입니다.");
        }
    }

    /**
     * MaintenanceRequest 타입별 추가 검증
     */
    private void validateMaintenanceRequest(MaintenanceRequest request) {
        // 유지보수 요청에 필요한 필수 필드 검증
        if (request.getContractStartDate() == null || request.getContractEndDate() == null) {
            throw new IllegalArgumentException("유지보수 계약의 시작일과 종료일은 필수입니다.");
        }

        if (request.getContractAmount() == null ||
                request.getContractAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("유지보수 계약 금액은 0보다 커야 합니다.");
        }

        if (StringUtils.isEmpty(request.getContractDetails())) {
            throw new IllegalArgumentException("유지보수 계약 세부내용은 필수입니다.");
        }
    }

    /**
     * 구매요청 수정 가능 여부 검증
     */
    private void validatePurchaseRequestModifiable(PurchaseRequest request, String username) {
        // 1. 상태 기반 검증 - 구매 요청 상태에서만 수정 가능
        if (request.getStatus() != null) {
            String statusCode = request.getStatus().getChildCode();
            if (!"REQUESTED".equals(statusCode)) {
                throw new IllegalStateException("현재 구매요청 상태(" + statusCode + ")에서는 수정할 수 없습니다. 구매 요청 상태에서만 수정 가능합니다.");
            }
        }

        // 2. 권한 기반 검증 - 요청자 또는 관리자만 수정 가능
        Member currentUser = memberRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("사용자 정보를 찾을 수 없습니다: " + username));

        boolean isAdmin = Member.Role.ADMIN.equals(currentUser.getRole());
        boolean isRequester = request.getMember() != null && request.getMember().getId().equals(currentUser.getId());

        if (!(isAdmin || isRequester)) {
            throw new SecurityException("구매요청 수정 권한이 없습니다. 요청자 또는 관리자만 수정할 수 있습니다.");
        }
    }

    /**
     * 구매요청 삭제 가능 여부 검증
     */
    private void validatePurchaseRequestDeletable(PurchaseRequest request, String username) {
        // 1. 상태 기반 검증 - 구매 요청 상태에서만 삭제 가능
        if (request.getStatus() != null) {
            String statusCode = request.getStatus().getChildCode();
            if (!"REQUESTED".equals(statusCode)) {
                throw new IllegalStateException("현재 구매요청 상태(" + statusCode + ")에서는 삭제할 수 없습니다. 구매 요청 상태에서만 삭제 가능합니다.");
            }
        }

        // 2. 권한 기반 검증 - 요청자 또는 관리자만 삭제 가능
        Member currentUser = memberRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("사용자 정보를 찾을 수 없습니다: " + username));

        boolean isAdmin = Member.Role.ADMIN.equals(currentUser.getRole());
        boolean isRequester = request.getMember() != null && request.getMember().getId().equals(currentUser.getId());

        if (!(isAdmin || isRequester)) {
            throw new SecurityException("구매요청 삭제 권한이 없습니다. 요청자 또는 관리자만 삭제할 수 있습니다.");
        }

        // 3. 시간 기반 제한 (선택사항) - 요청일 기준 24시간 이내만 삭제 가능
        LocalDate requestDate = request.getRequestDate();
        if (requestDate != null && requestDate.plusDays(1).isBefore(LocalDate.now())) {
            log.warn("요청일로부터 24시간이 지난 구매요청 삭제 시도: ID={}, 요청일={}", request.getId(), requestDate);
            // 경고만 하고 삭제 가능하게 하거나, 아래 주석 해제하여 제한 설정
            // throw new IllegalStateException("구매요청은 요청일로부터 24시간 이내에만 삭제할 수 있습니다.");
        }
    }

    @Transactional
    public PurchaseRequestDTO updatePurchaseRequestStatus(
            Long purchaseRequestId,
            String newStatusCode,
            String username
    ) {
        // 기존 상태 변경 로직
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(purchaseRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("구매요청을 찾을 수 없습니다."));

        // 기존 상태
        SystemStatus oldStatus = purchaseRequest.getStatus();

        // 새로운 상태 설정
        ParentCode parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("PURCHASE_REQUEST", "STATUS")
                .orElseThrow(() -> new ResourceNotFoundException("부모 코드를 찾을 수 없습니다."));

        ChildCode childCode = childCodeRepository.findByParentCodeAndCodeValue(parentCode, newStatusCode)
                .orElseThrow(() -> new ResourceNotFoundException("자식 코드를 찾을 수 없습니다."));

        SystemStatus newStatus = new SystemStatus(parentCode.getCodeName(), childCode.getCodeValue());
        purchaseRequest.setStatus(newStatus);

        // 현재 사용자 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        // 이벤트 발행
        PurchaseRequestStatusChangeEvent event = new PurchaseRequestStatusChangeEvent(
                this,
                purchaseRequestId,
                oldStatus.getFullCode(),
                newStatus.getFullCode(),
                currentUsername
        );

        // 애플리케이션 이벤트 발행
        applicationEventPublisher.publishEvent(event);

        return convertToDto(purchaseRequest);
    }
}