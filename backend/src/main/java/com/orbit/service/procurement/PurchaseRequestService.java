package com.orbit.service.procurement;

import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.dto.procurement.PurchaseRequestResponseDTO;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.Project;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.exception.ProjectNotFoundException;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.ProjectRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 구매 요청 관련 비즈니스 로직을 처리하는 서비스 클래스
 */
@Service
@Transactional
public class PurchaseRequestService {

    private static final Logger logger = LoggerFactory.getLogger(PurchaseRequestService.class);

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ProjectRepository projectRepository;
    private final MemberRepository memberRepository;

    /**
     * 생성자를 통한 의존성 주입
     * @param purchaseRequestRepository 구매 요청 리포지토리
     * @param projectRepository 프로젝트 리포지토리
     * @param memberRepository 멤버 리포지토리
     */
    public PurchaseRequestService(PurchaseRequestRepository purchaseRequestRepository,
                                  ProjectRepository projectRepository,
                                  MemberRepository memberRepository) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
    }

    /**
     * 모든 구매 요청을 조회합니다.
     * @return 구매 요청 목록
     */
    @Transactional(readOnly = true)
    public List<PurchaseRequestResponseDTO> getAllPurchaseRequests() {
        List<PurchaseRequest> purchaseRequests = purchaseRequestRepository.findAll();
        return purchaseRequests.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 구매 요청 ID로 구매 요청을 조회합니다.
     * @param id 구매 요청 ID
     * @return 조회된 구매 요청 (Optional)
     */
    @Transactional(readOnly = true)
    public Optional<PurchaseRequestResponseDTO> getPurchaseRequestById(Long id) {
        logger.info("Retrieving purchase request by id: {}", id);
        return purchaseRequestRepository.findById(id)
                .map(this::convertToDto);
    }

    /**
     * 새로운 구매 요청을 생성합니다.
     * @param purchaseRequestDTO 생성할 구매 요청 정보
     * @return 생성된 구매 요청
     */
    public PurchaseRequestResponseDTO createPurchaseRequest(PurchaseRequestDTO purchaseRequestDTO) {
        PurchaseRequest purchaseRequest = convertToEntity(purchaseRequestDTO);
        logger.info("Creating a new purchase request: {}", purchaseRequest);
        PurchaseRequest savedPurchaseRequest = purchaseRequestRepository.save(purchaseRequest);
        return convertToDto(savedPurchaseRequest);
    }

    /**
     * 구매 요청 정보를 업데이트합니다.
     * @param id 업데이트할 구매 요청 ID
     * @param purchaseRequestDTO 업데이트할 구매 요청 정보
     * @return 업데이트된 구매 요청
     * @throws ProjectNotFoundException 구매 요청을 찾을 수 없을 경우
     */
    public PurchaseRequestResponseDTO updatePurchaseRequest(Long id, PurchaseRequestDTO purchaseRequestDTO) {
        logger.info("Updating purchase request with id: {}, details: {}", id, purchaseRequestDTO);
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("Purchase request not found with id: " + id));

        purchaseRequest.setTitle(purchaseRequestDTO.getTitle());
        purchaseRequest.setDescription(purchaseRequestDTO.getDescription());
        purchaseRequest.setRequestDate(purchaseRequestDTO.getRequestDate());
        purchaseRequest.setDeliveryDate(purchaseRequestDTO.getDeliveryDate());
        purchaseRequest.setStatus(PurchaseRequest.PurchaseStatus.valueOf(purchaseRequestDTO.getStatus()));

        PurchaseRequest updatedPurchaseRequest = purchaseRequestRepository.save(purchaseRequest);
        return convertToDto(updatedPurchaseRequest);
    }

    /**
     * PurchaseRequestDTO를 PurchaseRequest 엔티티로 변환합니다.
     * @param purchaseRequestDTO 변환할 PurchaseRequestDTO
     * @return 변환된 PurchaseRequest 엔티티
     */
    private PurchaseRequest convertToEntity(PurchaseRequestDTO purchaseRequestDTO) {
        PurchaseRequest purchaseRequest = new PurchaseRequest();

        Project project = projectRepository.findById(purchaseRequestDTO.getProjectId())
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + purchaseRequestDTO.getProjectId()));
        purchaseRequest.setProject(project);

        // Member 엔티티 가져오기
        Member requester = memberRepository.findById(purchaseRequestDTO.getRequesterId())
                .orElseThrow(() -> new ProjectNotFoundException("Requester not found with id: " + purchaseRequestDTO.getRequesterId()));
        purchaseRequest.setRequester(requester);

        purchaseRequest.setTitle(purchaseRequestDTO.getTitle());
        purchaseRequest.setDescription(purchaseRequestDTO.getDescription());
        purchaseRequest.setRequestDate(purchaseRequestDTO.getRequestDate());
        purchaseRequest.setDeliveryDate(purchaseRequestDTO.getDeliveryDate());
        purchaseRequest.setStatus(PurchaseRequest.PurchaseStatus.valueOf(purchaseRequestDTO.getStatus()));

        // 추가 필드 (PurchaseRequest 테이블로 이동)
        purchaseRequest.setDepartment(purchaseRequestDTO.getDepartment());
        purchaseRequest.setProjectManager(purchaseRequestDTO.getProjectManager());
        purchaseRequest.setManagerPhone(purchaseRequestDTO.getManagerPhone());
        purchaseRequest.setSpecialNotes(purchaseRequestDTO.getSpecialNotes());
        purchaseRequest.setContractPeriod(purchaseRequestDTO.getContractPeriod());
        purchaseRequest.setContractAmount(purchaseRequestDTO.getContractAmount());
        purchaseRequest.setContractDetails(purchaseRequestDTO.getContractDetails());

        return purchaseRequest;
    }

    /**
     * PurchaseRequest 엔티티를 PurchaseRequestResponseDTO로 변환합니다.
     * @param purchaseRequest 변환할 PurchaseRequest 엔티티
     * @return 변환된 PurchaseRequestResponseDTO
     */
    private PurchaseRequestResponseDTO convertToDto(PurchaseRequest purchaseRequest) {
        PurchaseRequestResponseDTO purchaseRequestResponseDTO = new PurchaseRequestResponseDTO();
        purchaseRequestResponseDTO.setId(purchaseRequest.getId());
        purchaseRequestResponseDTO.setProjectId(purchaseRequest.getProject().getId());
        purchaseRequestResponseDTO.setTitle(purchaseRequest.getTitle());
        purchaseRequestResponseDTO.setDescription(purchaseRequest.getDescription());
        purchaseRequestResponseDTO.setTotalAmount(purchaseRequest.getTotalAmount());
        purchaseRequestResponseDTO.setStatus(purchaseRequest.getStatus().toString());
        purchaseRequestResponseDTO.setRequestDate(purchaseRequest.getRequestDate());
        purchaseRequestResponseDTO.setDeliveryDate(purchaseRequest.getDeliveryDate());
        return purchaseRequestResponseDTO;
    }
}
