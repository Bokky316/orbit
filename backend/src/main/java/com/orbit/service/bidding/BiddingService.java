package com.orbit.service.bidding;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.orbit.constant.BiddingStatus;
import com.orbit.constant.BiddingStatus.NotificationType;
import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingFormDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.dto.bidding.BiddingSupplierDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.bidding.BiddingSupplier;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.event.event.BiddingStatusChangeEvent;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.bidding.BiddingSupplierRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.PurchaseRequestItemRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import com.orbit.repository.supplier.SupplierRegistrationRepository;
import com.orbit.service.NotificationService;
import com.orbit.service.NotificationWebSocketService;
import com.orbit.util.BiddingNumberUtil;
import com.orbit.util.PriceCalculator;
import com.orbit.util.PriceCalculator.PriceResult;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingService {
    private final BiddingRepository biddingRepository;
    private final BiddingParticipationRepository participationRepository;
    private final BiddingSupplierRepository supplierRepository;
    private final MemberRepository memberRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseRequestItemRepository purchaseRequestItemRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;
    private final SupplierRegistrationRepository supplierRegistrationRepository;
    private final NotificationService notificationService;
    private final BiddingAuthorizationService biddingAuthorizationService;
    private final NotificationWebSocketService notificationWebSocketService;
    private final ApplicationEventPublisher applicationEventPublisher; 

    

    @Value("${uploadPath}")
    private String uploadPath;

    @Transactional(readOnly = true)
    public List<String> getBiddingStatusHistoryReasons(Long biddingId) {
        List<StatusHistory> histories = biddingRepository.findStatusHistoriesByBiddingId(biddingId);
        return histories.stream()
                .map(StatusHistory::getReason)
                .filter(reason -> reason != null)
                .collect(Collectors.toList());
    }

    // 파일 유효성 검사 메서드 추가
    private void validateFile(MultipartFile file) {
        // 파일 크기 제한 (50MB)
        long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.isEmpty()) {
            throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("파일 크기는 50MB를 초과할 수 없습니다: " + file.getOriginalFilename());
        }

        // 허용된 파일 타입 검사
        String[] ALLOWED_TYPES = {
            "image/jpeg", "image/png", "image/gif", 
            "application/pdf", 
            "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        };

        String contentType = file.getContentType();
        boolean isValidType = Arrays.stream(ALLOWED_TYPES)
            .anyMatch(type -> type.equals(contentType));

        if (!isValidType) {
            throw new IllegalArgumentException("지원되지 않는 파일 형식입니다: " + file.getOriginalFilename());
        }
    }

    // 고유한 파일명 생성 메서드 추가
    private String generateUniqueFilename(String originalFilename) {
        String uuid = UUID.randomUUID().toString();
        String extension = "";
        
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }
        
        return uuid + extension;
    }

    @Transactional
    public BiddingDto addAttachmentsToBidding(Long biddingId, MultipartFile[] files, Member currentMember) {
        // 입찰 공고 조회
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));

        // 파일 저장 경로 생성 (연/월 기준)
        LocalDate now = LocalDate.now();
        String uploadPath = String.format("%s/biddings/%d/%02d", 
            this.uploadPath, now.getYear(), now.getMonthValue());
        
        Path uploadDir = Paths.get(uploadPath);
        
        // 디렉토리 생성
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("파일 업로드 디렉토리 생성 실패", e);
        }

        // 첨부파일 처리
        for (MultipartFile file : files) {
            // 파일 유효성 검사
            validateFile(file);

            try {
                // 고유한 파일명 생성
                String originalFilename = file.getOriginalFilename();
                String uniqueFilename = generateUniqueFilename(originalFilename);
                Path targetPath = uploadDir.resolve(uniqueFilename);

                // 파일 저장
                file.transferTo(targetPath);

                // 파일 경로 저장
                bidding.getAttachmentPaths().add(targetPath.toString());
            } catch (IOException e) {
                throw new RuntimeException("파일 저장 중 오류 발생: " + file.getOriginalFilename(), e);
            }
        }

        // 업데이트된 입찰 공고 저장
        bidding = biddingRepository.save(bidding);

        // 업데이트된 입찰 공고 반환
        return convertToDto(bidding);
    }

    @Transactional
    public Resource downloadAttachment(Long biddingId, String filename) {
        // 입찰 공고 조회
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));

        // 파일 경로 확인
        Optional<String> filePath = bidding.getAttachmentPaths().stream()
                .filter(path -> path.endsWith(filename))
                .findFirst();

        if (filePath.isEmpty()) {
            throw new EntityNotFoundException("파일을 찾을 수 없습니다: " + filename);
        }

        try {
            // 파일 리소스 생성
            Path path = Paths.get(filePath.get());
            Resource resource = new UrlResource(path.toUri());

            // 파일 존재 및 읽기 가능 여부 확인
            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("파일을 읽을 수 없습니다: " + filename);
            }

            return resource;
        } catch (MalformedURLException e) {
            throw new RuntimeException("파일 다운로드 중 오류 발생: " + filename, e);
        }
    }

    @Transactional
    public void deleteAttachments(Long biddingId) {
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));

        // 모든 첨부파일 삭제
        for (String filePath : bidding.getAttachmentPaths()) {
            try {
                Files.deleteIfExists(Paths.get(filePath));
            } catch (IOException e) {
                log.error("파일 삭제 중 오류 발생: {}", filePath, e);
            }
        }

        // 첨부파일 목록 초기화
        bidding.getAttachmentPaths().clear();
        biddingRepository.save(bidding);
    }

    /**
     * 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingList(Map<String, Object> params) {
        String statusCode = params.get("status") != null ? (String) params.get("status") : null;
        LocalDateTime startDate = params.get("startDate") != null ? (LocalDateTime) params.get("startDate") : null;
        LocalDateTime endDate = params.get("endDate") != null ? (LocalDateTime) params.get("endDate") : null;
        
        List<Bidding> biddings;
        
        if (statusCode != null) {
            // 상태 코드로 필터링
            // ParentCode 객체 먼저 찾기
            Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
            if (parentCode.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
            }
            
            Optional<ChildCode> status = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), statusCode);
            if (status.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + statusCode);
            }
            
            biddings = biddingRepository.findByStatusChildAndBiddingPeriodStartDateGreaterThanEqualAndBiddingPeriodEndDateLessThanEqual(status.get(), startDate, endDate);
        } else {
            biddings = biddingRepository.findByBiddingPeriodStartDateGreaterThanEqualAndBiddingPeriodEndDateLessThanEqual(startDate, endDate);
        }
        
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 특정 상태의 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingsByStatus(String status) {
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
        }
        
        Optional<ChildCode> statusCode = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), status);
        if (statusCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + status);
        }
        
        List<Bidding> biddings = biddingRepository.findByStatusChild(statusCode.get());
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 특정 공급사가 초대된 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingsInvitedSupplier(Long supplierId) {
        // 멤버로 공급사 정보 조회
        Member supplier = memberRepository.findById(supplierId)
                .orElseThrow(() -> new EntityNotFoundException("공급사를 찾을 수 없습니다. ID: " + supplierId));
                
        List<Bidding> biddings = biddingRepository.findBiddingsInvitedSupplier(supplierId);
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 특정 공급사가 참여한 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingsParticipatedBySupplier(Long supplierId) {
        List<Bidding> biddings = biddingRepository.findBiddingsParticipatedBySupplier(supplierId);
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 입찰 공고 상세 조회
     */
    @Transactional(readOnly = true)
    public BiddingDto getBiddingById(Long id) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        return convertToDto(bidding);
    }

    /**
     * 입찰 공고 상태 조회
     * @param biddingId 입찰 공고 ID
     * @return 입찰 공고 상태 코드
     */
    @Transactional(readOnly = true)
    public String getBiddingStatus(Long biddingId) {
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        return bidding.getStatusChild() != null ? bidding.getStatusChild().getCodeValue() : null;
    }




    /**
     * 입찰 공고 생성
     */
    @Transactional
    public BiddingDto createBidding(BiddingFormDto formDto, Member currentMember) {
        // ChildCode 조회
        ChildCode statusChild = childCodeRepository.findByParentCodeAndCodeValue(
            parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS")
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS")),
            formDto.getStatus() // formDto에서 상태 코드 문자열 가져오기
        ).orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + formDto.getStatus()));

        // 권한 체크
        if (!biddingAuthorizationService.canCreateOrUpdateBidding(currentMember, statusChild)) {
            throw new AccessDeniedException("입찰 공고 생성 권한이 없습니다.");
        }

    // 입찰 번호 생성
    String bidNumber = BiddingNumberUtil.generateBidNumber();
    
    // 입찰 공고 엔티티 생성
    Bidding bidding = Bidding.builder()
            .bidNumber(bidNumber)
            .title(formDto.getTitle())
            .description(formDto.getDescription())
            .biddingPeriod(Bidding.BiddingPeriod.builder()
                    .startDate(formDto.getBiddingPeriod().getStartDate())
                    .endDate(formDto.getBiddingPeriod().getEndDate())
                    .build())
            .unitPrice(formDto.getUnitPrice())
            .quantity(formDto.getQuantity())
            .purchaseRequest(formDto.getPurchaseRequestId() != null ? 
                    purchaseRequestRepository.findById(formDto.getPurchaseRequestId()).orElse(null) : null)
            .purchaseRequestItem(formDto.getPurchaseRequestItemId() != null ?
                    purchaseRequestItemRepository.findById(formDto.getPurchaseRequestItemId()).orElse(null) : null)
            .attachmentPaths(formDto.getAttachmentPaths() != null ? formDto.getAttachmentPaths() : new ArrayList<>())
            .conditions(formDto.getConditions())
            .internalNote(formDto.getInternalNote())
            .build();
    
    // 입찰 기간 유효성 검사
    validateBiddingPeriod(bidding.getBiddingPeriod());
    
    // 상태 코드 설정
    Optional<ParentCode> statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
    if (statusParent.isEmpty()) {
        throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
    }
    
    Optional<ChildCode> pendingStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent.get(), "PENDING");
    if (pendingStatus.isEmpty()) {
        throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: PENDING");
    }
    
    bidding.setStatusParent(statusParent.get());
    bidding.setStatusChild(pendingStatus.get());
    
    // 입찰 방식 코드 설정
    String methodCode = formDto.getMethod();
    if (methodCode != null) {
        Optional<ParentCode> methodParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "METHOD");
        if (methodParent.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 방식 코드 그룹입니다: BIDDING_METHOD");
        }
        
        Optional<ChildCode> methodChild = childCodeRepository.findByParentCodeAndCodeValue(methodParent.get(), methodCode);
        if (methodChild.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 방식 코드입니다: " + methodCode);
        }
        
        bidding.setMethodParent(methodParent.get());
        bidding.setMethodChild(methodChild.get());
    }
    
    // 가격 재계산
    bidding.recalculatePrices();
    
    // 다중 공급자 정보 처리
    if (formDto.getSupplierIds() != null && !formDto.getSupplierIds().isEmpty()) {
        bidding.setDescription("공급자 ID: " + String.join(", ", 
            formDto.getSupplierIds().stream()
                .map(Object::toString)
                .collect(Collectors.toList())));
    }
    
    // 엔티티 저장
    bidding = biddingRepository.save(bidding);
    
    // 상태 이력 추가
    StatusHistory history = StatusHistory.builder()
            .entityType(StatusHistory.EntityType.BIDDING)
            .bidding(bidding)
            .fromStatus(null)
            .toStatus(pendingStatus.get())
            .reason("입찰 공고 생성")
            .changedAt(LocalDateTime.now())
            .build();
    
    bidding.getStatusHistories().add(history);
    
    // 공급사 초대 처리
    if (formDto.getSupplierIds() != null && !formDto.getSupplierIds().isEmpty()) {
        for (Long supplierId : formDto.getSupplierIds()) {
            try {
                // 공급사 조회
                Member supplier = memberRepository.findById(supplierId)
                        .orElseThrow(() -> new EntityNotFoundException("공급사를 찾을 수 없습니다. ID: " + supplierId));
                
                // 공급사 초대 생성
                BiddingSupplier supplierInvitation = new BiddingSupplier();
                supplierInvitation.setBidding(bidding);
                supplierInvitation.setSupplier(supplier);
                supplierInvitation.setCompanyName(supplier.getCompanyName());
                supplierInvitation.setNotificationSent(false);
                
                // 초대 저장
                bidding.getSuppliers().add(supplierInvitation);
                supplierRepository.save(supplierInvitation);
                
                // 알림 발송 
                supplierInvitation.sendNotification(
                    notificationService,
                    "새로운 입찰 공고 초대",
                    "입찰 공고 '" + bidding.getTitle() + "'에 참여 요청이 왔습니다. 확인해주세요."
                );
            } catch (Exception e) {
                log.error("공급사 초대 중 오류 발생: {}", e.getMessage());
            }
        }
    }
    
        // 최종 저장
        bidding = biddingRepository.save(bidding);

        // 알림 전송
        notificationWebSocketService.sendNotificationToDepartmentLevel(BiddingStatus.NotificationType.BIDDING_CREATED, 
                "새로운 입찰 공고 '" + bidding.getTitle() + "'이 생성되었습니다.", 
                BiddingStatus.ASSISTANT_MANAGER_LEVEL);

        notificationWebSocketService.sendAdminNotification(BiddingStatus.NotificationType.BIDDING_CREATED,
                "새로운 입찰 공고 '" + bidding.getTitle() + "'이 생성되었습니다.");
        
        return convertToDto(bidding);
    }


    /**
     * 입찰 기간 유효성 검사
     */
    private void validateBiddingPeriod(Bidding.BiddingPeriod period) {
        if (period == null) {
            throw new IllegalArgumentException("입찰 기간 정보가 필요합니다.");
        }
        
        if (period.getStartDate() == null || period.getEndDate() == null) {
            throw new IllegalArgumentException("입찰 시작일과 종료일은 필수 입력 항목입니다.");
        }

        if (period.getStartDate().isAfter(period.getEndDate())) {
            throw new IllegalArgumentException("입찰 종료일은 시작일 이후여야 합니다.");
        }
    }


    /**
     * 입찰 공고 수정
     */
    @Transactional
    public BiddingDto updateBidding(Long id, BiddingFormDto formDto) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        // 이전 상태 저장 (상태 변경 이력 추적용)
        ChildCode oldStatus = bidding.getStatusChild();
        
        // 기본 정보 업데이트
        bidding.setTitle(formDto.getTitle());
        bidding.setDescription(formDto.getDescription());
        bidding.setQuantity(formDto.getQuantity());
        bidding.setUnitPrice(formDto.getUnitPrice());
        
        // 입찰 기간 업데이트
        updateBiddingPeriod(bidding, formDto);
        
        // 기타 정보 업데이트 
        bidding.setConditions(formDto.getConditions());
        bidding.setInternalNote(formDto.getInternalNote());
        
        // 첨부파일 처리
        if (formDto.getAttachmentPaths() != null) {
            bidding.setAttachmentPaths(formDto.getAttachmentPaths());
        }
        
        // 상태 코드 업데이트 (변경이 있는 경우)
        String statusCode = formDto.getStatus();
        if (statusCode != null) {
            Optional<ParentCode> statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
            if (statusParent.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
            }
            
            Optional<ChildCode> newStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent.get(), statusCode);
            if (newStatus.isPresent() && !newStatus.get().equals(oldStatus)) {
                bidding.setStatusChild(newStatus.get());
                
                // 상태 변경 이력 추가
                StatusHistory history = StatusHistory.builder()
                        .entityType(StatusHistory.EntityType.BIDDING)
                        .bidding(bidding)
                        .fromStatus(oldStatus)
                        .toStatus(newStatus.get())
                        .reason(formDto.getDescription()) // 상태 변경 이유는 설명에서 가져옴
                        .changedAt(LocalDateTime.now())
                        .build();
                
                bidding.getStatusHistories().add(history);
            }
        }
        
        // 입찰 방식 코드 업데이트 (변경이 있는 경우)
        String methodCode = formDto.getMethod();
        if (methodCode != null) {
            Optional<ParentCode> methodParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "METHOD");
            if (methodParent.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 방식 코드 그룹입니다: BIDDING_METHOD");
            }
            
            Optional<ChildCode> newMethod = childCodeRepository.findByParentCodeAndCodeValue(methodParent.get(), methodCode);
            if (newMethod.isPresent()) {
                bidding.setMethodChild(newMethod.get());
            }
        }
        
        // 가격 재계산
        bidding.recalculatePrices();
        
        // 엔티티 저장
        bidding = biddingRepository.save(bidding);
        
        return convertToDto(bidding);
    }

    /**
     * 입찰 기간 업데이트
     */
    private void updateBiddingPeriod(Bidding bidding, BiddingFormDto formDto) {
        Bidding.BiddingPeriod period = bidding.getBiddingPeriod();
        if (period == null) {
            period = new Bidding.BiddingPeriod();
            bidding.setBiddingPeriod(period);
        }
        
        if (formDto.getBiddingPeriod() != null) {
            period.setStartDate(formDto.getBiddingPeriod().getStartDate());
            period.setEndDate(formDto.getBiddingPeriod().getEndDate());
            
            // 유효성 검사
            validateBiddingPeriod(period);
        }
    }


    /**
     * 입찰 공고 삭제
     */
    @Transactional
    public void deleteBidding(Long id) {
        if (!biddingRepository.existsById(id)) {
            throw new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id);
        }
        
        biddingRepository.deleteById(id);
    }

    /**
     * 입찰 상태 변경
     */
    @Transactional
    public BiddingDto changeBiddingStatus(Long id, String status, String reason) {
        // 입찰 공고 조회
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        // 이전 상태 저장
        ChildCode oldStatus = bidding.getStatusChild();
        String oldStatusCode = oldStatus != null ? oldStatus.getCodeValue() : null;
        
        // 현재 인증된 사용자 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        Member currentMember = memberRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new EntityNotFoundException("사용자 정보를 찾을 수 없습니다."));
        
        // 상태 변경 권한 확인
        if (!biddingAuthorizationService.canChangeBiddingStatus(currentMember, oldStatusCode, status)) {
            throw new AccessDeniedException("입찰 공고 상태 변경 권한이 없습니다.");
        }
        
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
        }
        
        // 새 상태 코드 조회
        Optional<ChildCode> newStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), status);
        if (newStatus.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + status);
        }
        
        // 상태 변경 및 알림 발송 
        bidding.setStatusChild(newStatus.get());
        
        // 상태 변경 이력 추가
        StatusHistory history = StatusHistory.builder()
                .entityType(StatusHistory.EntityType.BIDDING)
                .bidding(bidding)
                .fromStatus(oldStatus)
                .toStatus(newStatus.get())
                .reason(reason)
                .changedById(memberRepository.findByUsername(currentUsername)
                .map(Member::getId)
                .orElse(null))
                .changedAt(LocalDateTime.now())
                .build();
        
        bidding.getStatusHistories().add(history);
        
        // 엔티티 저장
        bidding = biddingRepository.save(bidding);
        
        // 상태 변경 이벤트 발행 - 웹소켓 및 Redis 통합
        applicationEventPublisher.publishEvent(new BiddingStatusChangeEvent(
            this,
            bidding.getId(),
            oldStatusCode,
            status,
            currentUsername
        ));
        
        // 상태 변경에 따른 알림 처리
        //sendStatusChangeNotifications(bidding, oldStatusCode, status);
        
        return convertToDto(bidding);
    }

    /**
     * 상태 변경에 따른 적절한 알림 발송
     */
    private void sendStatusChangeNotifications(Bidding bidding, String oldStatus, String newStatus) {
        // 입찰 공고 제목
        String biddingTitle = bidding.getTitle();
        
        // 상태 변경 유형에 따른 알림 처리
        if (BiddingStatus.BiddingStatusCode.PENDING.equals(oldStatus) 
                && BiddingStatus.BiddingStatusCode.ONGOING.equals(newStatus)) {
            // 대기 -> 진행: 공급사에게 알림
            List<Long> supplierIds = bidding.getSuppliers().stream()
                    .map(s -> s.getSupplier().getId())
                    .collect(Collectors.toList());
            
            notificationWebSocketService.sendNotificationToSuppliers(
                    NotificationType.BIDDING_STARTED,
                    "입찰 공고 '" + biddingTitle + "'가 시작되었습니다. 참여를 검토해주세요.",
                    supplierIds
            );
            
            // 관리자에게도 알림
            notificationWebSocketService.sendAdminNotification(
                    NotificationType.BIDDING_STARTED,
                    "입찰 공고 '" + biddingTitle + "'가 시작되었습니다."
            );
        } 
        else if (BiddingStatus.BiddingStatusCode.ONGOING.equals(oldStatus)
                && BiddingStatus.BiddingStatusCode.CLOSED.equals(newStatus)) {
            // 진행 -> 마감: 참여 공급사, 구매 부서 이상에게 알림
            List<Long> supplierIds = bidding.getSuppliers().stream()
                    .map(s -> s.getSupplier().getId())
                    .collect(Collectors.toList());
            
            notificationWebSocketService.sendNotificationToSuppliers(
                    NotificationType.BIDDING_CLOSED,
                    "입찰 공고 '" + biddingTitle + "'가 마감되었습니다. 결과를 기다려주세요.",
                    supplierIds
            );
            
            // 구매 부서 대리급 이상에게 알림
            notificationWebSocketService.sendNotificationToDepartmentLevel(
                    NotificationType.BIDDING_CLOSED,
                    "입찰 공고 '" + biddingTitle + "'가 마감되었습니다. 평가를 진행해주세요.",
                    BiddingStatus.ASSISTANT_MANAGER_LEVEL
            );
        }
        else if (BiddingStatus.BiddingStatusCode.ONGOING.equals(oldStatus)
                && BiddingStatus.BiddingStatusCode.CANCELED.equals(newStatus)) {
            // 진행 -> 취소: 참여 공급사에게 알림
            List<Long> supplierIds = bidding.getSuppliers().stream()
                    .map(s -> s.getSupplier().getId())
                    .collect(Collectors.toList());
            
            notificationWebSocketService.sendNotificationToSuppliers(
                    NotificationType.BIDDING_CANCELED,
                    "입찰 공고 '" + biddingTitle + "'가 취소되었습니다.",
                    supplierIds
            );
        }
    }

    /**
     * 상태 변경 이력 조회
     */
    @Transactional(readOnly = true)
    public List<StatusHistory> getBiddingStatusHistories(Long biddingId) {
        return biddingRepository.findStatusHistoriesByBiddingId(biddingId);
    }

    /**
     * 입찰 참여
     */
    @Transactional
    public BiddingParticipationDto participateInBidding(BiddingParticipationDto participationDto) {
        // 입찰 참여 검증
        validateBiddingParticipation(participationDto);
        
        Bidding bidding = biddingRepository.findById(participationDto.getBiddingId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + participationDto.getBiddingId()));
        
        BiddingParticipation participation = participationDto.toEntity();
        participation.setBidding(bidding);
        
        // 참여 정보 설정
        participation.setSubmittedAt(LocalDateTime.now());
        
        // 공급사 정보 설정 (이름 등)
        if (participation.getSupplierId() != null) {
            Member supplier = memberRepository.findById(participation.getSupplierId())
                    .orElse(null);
            if (supplier != null) {
                participation.setCompanyName(supplier.getCompanyName());
            }
        }
        
        // 가격 계산
        calculateParticipationPrices(participation, bidding.getQuantity());
        participation = participationRepository.save(participation);
        
        // 입찰 공고에 참여 추가
        bidding.getParticipations().add(participation);
        
        return BiddingParticipationDto.fromEntity(participation);
    }

    /**
     * 입찰 참여 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingParticipationDto> getBiddingParticipations(Long biddingId) {
        List<BiddingParticipation> participations = participationRepository.findByBiddingId(biddingId);
        
        return participations.stream()
                .map(BiddingParticipationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 입찰 참여 상세 조회
     */
    @Transactional(readOnly = true)
    public BiddingParticipationDto getParticipationById(Long id) {
        BiddingParticipation participation = participationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + id));
        
        return BiddingParticipationDto.fromEntity(participation);
    }

    /**
     * 입찰 참여 검증
     */
    private void validateBiddingParticipation(BiddingParticipationDto participation) {
        Bidding bidding = biddingRepository.findById(participation.getBiddingId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + participation.getBiddingId()));
        
        // 상태 코드 확인
        if (bidding.getStatusChild() != null) {
            String statusCode = bidding.getStatusChild().getCodeValue();
            
            // 진행중 상태가 아니면 참여 불가
            if (!"ONGOING".equals(statusCode)) {
                throw new IllegalStateException("현재 참여 가능한 상태가 아닙니다. 현재 상태: " + bidding.getStatusChild().getCodeName());
            }
        }
        
        // 마감일이 지났는지 확인
        if (LocalDateTime.now().isAfter(bidding.getBiddingPeriod().getEndDate().atStartOfDay())) {
            throw new IllegalStateException("입찰 마감일이 지났습니다.");
        }
        
        // 이미 참여한 공급자인지 확인
        if (participationRepository.existsByBiddingIdAndSupplierId(
                participation.getBiddingId(), participation.getSupplierId())) {
            throw new IllegalStateException("이미 참여한 입찰입니다.");
        }
    }

    /**
     * 입찰 참여 금액 계산
     */
    private void calculateParticipationPrices(BiddingParticipation participation, Integer quantity) {
        BigDecimal unitPrice = participation.getUnitPrice();
        Integer actualQuantity = quantity != null ? quantity : 1;
        
        if (unitPrice != null) {
            PriceResult result = PriceCalculator.calculateAll(unitPrice, actualQuantity);
            
            participation.setSupplyPrice(result.getSupplyPrice());
            participation.setVat(result.getVat());
            participation.setTotalAmount(result.getTotalAmount());
        }
    }

    /**
     * 공급사 참여 의사 확인
     */
    @Transactional
    public BiddingParticipationDto confirmSupplierParticipation(Long participationId) {
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        participation.confirmParticipation();
        participation = participationRepository.save(participation);
        
        return BiddingParticipationDto.fromEntity(participation);
    }


    /**
     * 공급사 초대
     */
    @Transactional
    public BiddingSupplierDto inviteSupplier(Long biddingId, Long supplierId) {
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
                
        // 멤버 조회
        Member supplier = memberRepository.findById(supplierId)
                .orElseThrow(() -> new EntityNotFoundException("공급사를 찾을 수 없습니다. ID: " + supplierId));
        
        // 이미 초대된 공급사인지 확인
        if (supplierRepository.existsByBiddingIdAndSupplierId(biddingId, supplierId)) {
            throw new IllegalStateException("이미 초대된 공급사입니다.");
        }
        
        // 공급사 초대 생성
        BiddingSupplier supplierInvitation = new BiddingSupplier();
        supplierInvitation.setBidding(bidding);
        supplierInvitation.setSupplier(supplier);
        supplierInvitation.setCompanyName(supplier.getCompanyName());
        supplierInvitation.setNotificationSent(false);
        
        // 공급사 초대 저장
        bidding.getSuppliers().add(supplierInvitation);
        supplierInvitation = supplierRepository.save(supplierInvitation);
        
        // 알림 발송
        supplierInvitation.sendNotification(
            notificationService,
            "새로운 입찰 공고 초대",
            "입찰 공고 '" + bidding.getTitle() + "'에 참여 요청이 왔습니다. 확인해주세요."
        );
        
        return BiddingSupplierDto.fromEntityWithBusinessNo(supplierInvitation, supplierRegistrationRepository);
    }

    /**
     * 특정 입찰 공고에 초대된 공급사 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingSupplierDto> getInvitedSuppliers(Long biddingId) {
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        return bidding.getSuppliers().stream()
                .map(supplier -> BiddingSupplierDto.fromEntityWithBusinessNo(supplier, supplierRegistrationRepository))
                .collect(Collectors.toList());
    }


    /**
     * Bidding 엔티티를 BiddingDto로 변환 (공급사 정보 포함)
     */
    private BiddingDto convertToDto(Bidding bidding) {
        BiddingDto dto = new BiddingDto();
        
        // 기본 정보 설정
        dto.setId(bidding.getId());
        dto.setBidNumber(bidding.getBidNumber());
        dto.setTitle(bidding.getTitle());
        dto.setDescription(bidding.getDescription());
        dto.setConditions(bidding.getConditions());
        dto.setInternalNote(bidding.getInternalNote());
        dto.setQuantity(bidding.getQuantity());
        dto.setUnitPrice(bidding.getUnitPrice());
        dto.setSupplyPrice(bidding.getSupplyPrice());
        dto.setVat(bidding.getVat());
        dto.setTotalAmount(bidding.getTotalAmount());
        
        // 입찰 기간 정보 설정
        if (bidding.getBiddingPeriod() != null) {
            BiddingDto.BiddingPeriodDto periodDto = new BiddingDto.BiddingPeriodDto(
                bidding.getBiddingPeriod().getStartDate(),
                bidding.getBiddingPeriod().getEndDate()
            );
            dto.setBiddingPeriod(periodDto);
        }
        
        // 상태 코드 설정
        if (bidding.getStatusChild() != null) {
            dto.setStatus(bidding.getStatusChild().getCodeValue());
            dto.setStatusName(bidding.getStatusChild().getCodeName());
        }
        
        // 입찰 방식 코드 설정
        if (bidding.getMethodChild() != null) {
            dto.setMethod(bidding.getMethodChild().getCodeValue());
            dto.setMethodName(bidding.getMethodChild().getCodeName());
        }
        
        // 첨부파일 목록 설정
        dto.setAttachmentPaths(bidding.getAttachmentPaths());
        
        // 생성 및 수정 정보 설정
        dto.setRegTime(bidding.getRegTime());
        dto.setUpdateTime(bidding.getUpdateTime());
        dto.setCreatedBy(bidding.getCreatedBy());
        dto.setModifiedBy(bidding.getModifiedBy());
        
        // 구매 요청 정보 설정
        if (bidding.getPurchaseRequest() != null) {
            dto.setPurchaseRequestId(bidding.getPurchaseRequest().getId());
            dto.setPurchaseRequestName(bidding.getPurchaseRequest().getRequestName());
        }
        
        // 구매 요청 품목 정보 설정
        if (bidding.getPurchaseRequestItem() != null) {
            dto.setPurchaseRequestItemId(bidding.getPurchaseRequestItem().getId());
        }
        
        // 공급사 정보 변환 (사업자번호 포함)
        if (bidding.getSuppliers() != null && !bidding.getSuppliers().isEmpty()) {
            List<BiddingSupplierDto> supplierDtos = bidding.getSuppliers().stream()
                .map(supplier -> BiddingSupplierDto.fromEntityWithBusinessNo(supplier, supplierRegistrationRepository))
                .collect(Collectors.toList());
            
            dto.setSuppliers(supplierDtos);
            dto.setTotalSuppliers(supplierDtos.size());
        }
        
        // 참여 정보 변환
        if (bidding.getParticipations() != null && !bidding.getParticipations().isEmpty()) {
            List<BiddingParticipationDto> participationDtos = bidding.getParticipations().stream()
                .map(BiddingParticipationDto::fromEntity)
                .collect(Collectors.toList());
            
            dto.setParticipations(participationDtos);
            dto.setTotalParticipations(participationDtos.size());
        }
        
        return dto;
        }

}