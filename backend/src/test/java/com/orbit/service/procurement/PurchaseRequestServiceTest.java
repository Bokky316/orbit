package com.orbit.service.procurement;

import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.dto.procurement.PurchaseRequestResponseDTO;
import com.orbit.entity.Member;
import com.orbit.entity.procurement.Project;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.exception.ProjectNotFoundException;
import com.orbit.repository.MemberRepository;
import com.orbit.repository.procurement.ProjectRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * PurchaseRequestService에 대한 단위 테스트 클래스
 */
@ExtendWith(MockitoExtension.class)
public class PurchaseRequestServiceTest {

    @Mock
    private PurchaseRequestRepository purchaseRequestRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private PurchaseRequestService purchaseRequestService;

    private PurchaseRequest purchaseRequest1;
    private PurchaseRequest purchaseRequest2;
    private PurchaseRequestDTO purchaseRequestDTO;

    /**
     * 각 테스트 메서드 실행 전에 호출되어 테스트 환경을 설정합니다.
     */
    @BeforeEach
    void setUp() {
        // 테스트에 사용될 객체 생성
        Project project = new Project();
        project.setId(1L);

        Member requester = new Member();
        requester.setId(1L);

        purchaseRequest1 = new PurchaseRequest();
        purchaseRequest1.setId(1L);
        purchaseRequest1.setProject(project);
        purchaseRequest1.setRequester(requester);
        purchaseRequest1.setTitle("Test Title 1");
        purchaseRequest1.setDescription("Test Description 1");
        purchaseRequest1.setTotalAmount(1000.0);
        purchaseRequest1.setStatus(PurchaseRequest.PurchaseStatus.대기);
        purchaseRequest1.setRequestDate(LocalDate.now());
        purchaseRequest1.setDeliveryDate(LocalDate.now().plusDays(7));

        purchaseRequest2 = new PurchaseRequest();
        purchaseRequest2.setId(2L);
        purchaseRequest2.setProject(project);
        purchaseRequest2.setRequester(requester);
        purchaseRequest2.setTitle("Test Title 2");
        purchaseRequest2.setDescription("Test Description 2");
        purchaseRequest2.setTotalAmount(2000.0);
        purchaseRequest2.setStatus(PurchaseRequest.PurchaseStatus.승인);
        purchaseRequest2.setRequestDate(LocalDate.now());
        purchaseRequest2.setDeliveryDate(LocalDate.now().plusDays(14));

        purchaseRequestDTO = new PurchaseRequestDTO();
        purchaseRequestDTO.setProjectId(1L);
        purchaseRequestDTO.setTitle("Test Title DTO");
        purchaseRequestDTO.setDescription("Test Description DTO");
        purchaseRequestDTO.setRequestDate(LocalDate.now());
        purchaseRequestDTO.setDeliveryDate(LocalDate.now().plusDays(7));
        purchaseRequestDTO.setStatus("대기");
    }

    /**
     * 모든 구매 요청 정보를 조회하는 메서드에 대한 테스트
     */
    @Test
    void getAllPurchaseRequests_shouldReturnAllPurchaseRequests() {
        // Given
        when(purchaseRequestRepository.findAll()).thenReturn(Arrays.asList(purchaseRequest1, purchaseRequest2));

        // When
        List<PurchaseRequestResponseDTO> purchaseRequests = purchaseRequestService.getAllPurchaseRequests();

        // Then
        assertEquals(2, purchaseRequests.size());
        assertEquals(purchaseRequest1.getTitle(), purchaseRequests.get(0).getTitle());
        assertEquals(purchaseRequest2.getTitle(), purchaseRequests.get(1).getTitle());
    }

    /**
     * 구매 요청 ID로 구매 요청 정보를 조회하는 메서드에 대한 테스트 (구매 요청 정보가 존재하는 경우)
     */
    @Test
    void getPurchaseRequestById_shouldReturnPurchaseRequest_whenPurchaseRequestExists() {
        // Given
        when(purchaseRequestRepository.findById(1L)).thenReturn(Optional.of(purchaseRequest1));

        // When
        Optional<PurchaseRequestResponseDTO> purchaseRequest = purchaseRequestService.getPurchaseRequestById(1L);

        // Then
        assertTrue(purchaseRequest.isPresent());
        assertEquals(purchaseRequest1.getTitle(), purchaseRequest.get().getTitle());
    }

    /**
     * 구매 요청 ID로 구매 요청 정보를 조회하는 메서드에 대한 테스트 (구매 요청 정보가 존재하지 않는 경우)
     */
    @Test
    void getPurchaseRequestById_shouldReturnEmpty_whenPurchaseRequestDoesNotExist() {
        // Given
        when(purchaseRequestRepository.findById(3L)).thenReturn(Optional.empty());

        // When
        Optional<PurchaseRequestResponseDTO> purchaseRequest = purchaseRequestService.getPurchaseRequestById(3L);

        // Then
        assertFalse(purchaseRequest.isPresent());
    }

    /**
     * 새로운 구매 요청 정보를 생성하는 메서드에 대한 테스트
     */
    @Test
    void createPurchaseRequest_shouldCreateNewPurchaseRequest() {
        // Given
        when(projectRepository.findById(1L)).thenReturn(Optional.of(purchaseRequest1.getProject()));
        when(memberRepository.findById(1L)).thenReturn(Optional.of(purchaseRequest1.getRequester()));
        when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenReturn(purchaseRequest1);

        // When
        PurchaseRequestResponseDTO createdPurchaseRequest = purchaseRequestService.createPurchaseRequest(purchaseRequestDTO);

        // Then
        assertEquals(purchaseRequest1.getTitle(), createdPurchaseRequest.getTitle());
    }

    /**
     * 구매 요청 정보를 업데이트하는 메서드에 대한 테스트 (구매 요청 정보가 존재하는 경우)
     */
    @Test
    void updatePurchaseRequest_shouldUpdatePurchaseRequest_whenPurchaseRequestExists() {
        // Given
        when(purchaseRequestRepository.findById(1L)).thenReturn(Optional.of(purchaseRequest1));
        when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenReturn(purchaseRequest1);

        PurchaseRequestDTO purchaseRequestDTO = new PurchaseRequestDTO();
        purchaseRequestDTO.setProjectId(1L);
        purchaseRequestDTO.setTitle("Updated Title");
        purchaseRequestDTO.setDescription("Updated Description");
        purchaseRequestDTO.setRequestDate(LocalDate.now());
        purchaseRequestDTO.setDeliveryDate(LocalDate.now().plusDays(7));
        purchaseRequestDTO.setStatus("승인");

        // When
        PurchaseRequestResponseDTO updatedPurchaseRequest = purchaseRequestService.updatePurchaseRequest(1L, purchaseRequestDTO);

        // Then
        assertEquals("Updated Title", updatedPurchaseRequest.getTitle());
        assertEquals("승인", updatedPurchaseRequest.getStatus());
    }

    /**
     * 구매 요청 정보를 업데이트하는 메서드에 대한 테스트 (구매 요청 정보가 존재하지 않는 경우)
     */
    @Test
    void updatePurchaseRequest_shouldThrowException_whenPurchaseRequestDoesNotExist() {
        // Given
        when(purchaseRequestRepository.findById(4L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ProjectNotFoundException.class, () -> purchaseRequestService.updatePurchaseRequest(4L, purchaseRequestDTO));
    }
}

