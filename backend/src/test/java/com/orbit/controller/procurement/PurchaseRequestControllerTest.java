package com.orbit.controller.procurement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.dto.procurement.PurchaseRequestResponseDTO;
import com.orbit.service.procurement.PurchaseRequestService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * PurchaseRequestController에 대한 통합 테스트 클래스
 *
 * @SpringBootTest: Spring Boot 기반 애플리케이션 컨텍스트를 로드하여 통합 테스트를 수행합니다.
 * @AutoConfigureMockMvc: MockMvc를 자동으로 구성하여 Controller를 테스트할 수 있도록 합니다.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class PurchaseRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PurchaseRequestService purchaseRequestService;

    @Autowired
    private ObjectMapper objectMapper;

    @Configuration
    static class TestConfig {
        @Bean
        public PurchaseRequestService purchaseRequestService() {
            return mock(PurchaseRequestService.class);
        }

        @Bean
        public ObjectMapper objectMapper() {
            return new ObjectMapper();
        }
    }

    /**
     * 모든 구매 요청 정보를 조회하는 API에 대한 테스트
     */
    @Test
    void getAllPurchaseRequests_shouldReturnAllPurchaseRequests() throws Exception {
        // Given
        PurchaseRequestService mockPurchaseRequestService = mock(PurchaseRequestService.class);
        PurchaseRequestResponseDTO purchaseRequest1 = new PurchaseRequestResponseDTO();
        purchaseRequest1.setId(1L);
        purchaseRequest1.setTitle("Test Title 1");

        PurchaseRequestResponseDTO purchaseRequest2 = new PurchaseRequestResponseDTO();
        purchaseRequest2.setId(2L);
        purchaseRequest2.setTitle("Test Title 2");

        List<PurchaseRequestResponseDTO> purchaseRequests = Arrays.asList(purchaseRequest1, purchaseRequest2);
        when(mockPurchaseRequestService.getAllPurchaseRequests()).thenReturn(purchaseRequests);

        // When & Then
        mockMvc.perform(get("/api/purchase-requests"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].title").value("Test Title 1"))
                .andExpect(jsonPath("$[1].title").value("Test Title 2"));
    }

    /**
     * 구매 요청 ID로 구매 요청 정보를 조회하는 API에 대한 테스트 (구매 요청 정보가 존재하는 경우)
     */
    @Test
    void getPurchaseRequestById_shouldReturnPurchaseRequest_whenPurchaseRequestExists() throws Exception {
        // Given
        PurchaseRequestService mockPurchaseRequestService = mock(PurchaseRequestService.class);
        PurchaseRequestResponseDTO purchaseRequest = new PurchaseRequestResponseDTO();
        purchaseRequest.setId(1L);
        purchaseRequest.setTitle("Test Title");
        when(mockPurchaseRequestService.getPurchaseRequestById(1L)).thenReturn(Optional.of(purchaseRequest));

        // When & Then
        mockMvc.perform(get("/api/purchase-requests/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.title").value("Test Title"));
    }

    /**
     * 구매 요청 ID로 구매 요청 정보를 조회하는 API에 대한 테스트 (구매 요청 정보가 존재하지 않는 경우)
     */
    @Test
    void getPurchaseRequestById_shouldReturnNotFound_whenPurchaseRequestDoesNotExist() throws Exception {
        // Given
        PurchaseRequestService mockPurchaseRequestService = mock(PurchaseRequestService.class);
        when(mockPurchaseRequestService.getPurchaseRequestById(3L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/purchase-requests/3"))
                .andExpect(status().isNotFound());
    }

    /**
     * 새로운 구매 요청 정보를 생성하는 API에 대한 테스트
     */
    @Test
    void createPurchaseRequest_shouldCreateNewPurchaseRequest() throws Exception {
        // Given
        PurchaseRequestService mockPurchaseRequestService = mock(PurchaseRequestService.class);
        PurchaseRequestDTO purchaseRequestDTO = new PurchaseRequestDTO();
        purchaseRequestDTO.setTitle("Test Title");
        purchaseRequestDTO.setDescription("Test Description");
        purchaseRequestDTO.setRequestDate(LocalDate.now());
        purchaseRequestDTO.setDeliveryDate(LocalDate.now().plusDays(7));
        purchaseRequestDTO.setStatus("대기");

        PurchaseRequestResponseDTO createdPurchaseRequest = new PurchaseRequestResponseDTO();
        createdPurchaseRequest.setId(1L);
        createdPurchaseRequest.setTitle("Test Title");
        createdPurchaseRequest.setDescription("Test Description");
        createdPurchaseRequest.setRequestDate(LocalDate.now());
        createdPurchaseRequest.setDeliveryDate(LocalDate.now().plusDays(7));
        createdPurchaseRequest.setStatus("대기");

        when(mockPurchaseRequestService.createPurchaseRequest(any(PurchaseRequestDTO.class))).thenReturn(createdPurchaseRequest);

        // When & Then
        mockMvc.perform(post("/api/purchase-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(purchaseRequestDTO)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.title").value("Test Title"))
                .andExpect(jsonPath("$.description").value("Test Description"));
    }

    /**
     * 구매 요청 정보를 업데이트하는 API에 대한 테스트
     */
    @Test
    void updatePurchaseRequest_shouldUpdatePurchaseRequest_whenPurchaseRequestExists() throws Exception {
        // Given
        PurchaseRequestService mockPurchaseRequestService = mock(PurchaseRequestService.class);
        PurchaseRequestDTO purchaseRequestDTO = new PurchaseRequestDTO();
        purchaseRequestDTO.setTitle("Updated Title");
        purchaseRequestDTO.setDescription("Updated Description");
        purchaseRequestDTO.setRequestDate(LocalDate.now());
        purchaseRequestDTO.setDeliveryDate(LocalDate.now().plusDays(7));
        purchaseRequestDTO.setStatus("승인");

        PurchaseRequestResponseDTO updatedPurchaseRequest = new PurchaseRequestResponseDTO();
        updatedPurchaseRequest.setId(1L);
        updatedPurchaseRequest.setTitle("Updated Title");
        updatedPurchaseRequest.setDescription("Updated Description");
        updatedPurchaseRequest.setRequestDate(LocalDate.now());
        updatedPurchaseRequest.setDeliveryDate(LocalDate.now().plusDays(7));
        updatedPurchaseRequest.setStatus("승인");

        when(mockPurchaseRequestService.updatePurchaseRequest(any(Long.class), any(PurchaseRequestDTO.class))).thenReturn(updatedPurchaseRequest);

        // When & Then
        mockMvc.perform(put("/api/purchase-requests/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(purchaseRequestDTO)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.title").value("Updated Title"))
                .andExpect(jsonPath("$.description").value("Updated Description"));
    }
}
