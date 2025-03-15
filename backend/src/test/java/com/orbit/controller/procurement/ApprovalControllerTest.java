package com.orbit.controller.procurement;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Collection;
import java.util.UUID;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockCookie;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orbit.config.jwt.TokenProvider;
import com.orbit.dto.approval.ApprovalDTO;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.Project;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.ProjectRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import com.orbit.service.RedisService;
import com.orbit.service.procurement.ApprovalLineService;

/**
 * ApprovalController에 대한 통합 테스트 클래스
 * Spring Boot 기반의 전체 테스트 환경에서 ApprovalController의 API 엔드포인트를 테스트
 */
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "testuser", roles = "BUYER")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class ApprovalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApprovalLineService approvalService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TokenProvider tokenProvider;

    @Autowired
    private RedisService redisService;

    @Autowired
    private MemberRepository memberRepository;

//    @Autowired
//    private ApprovalRepository approvalRepository;

    @Autowired
    private PurchaseRequestRepository purchaseRequestRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String testToken;
    private static final String TEST_USERNAME = "testuser"; // 테스트에 사용될 이메일 주소
    private Member testMember; // 테스트에 사용될 Member 객체

    private static final Logger logger = LoggerFactory.getLogger(ApprovalControllerTest.class);

    /**
     * 모든 테스트 실행 전에 한 번만 수행되는 설정 테스트 사용자를 생성하고 저장합니다.
     */
    @BeforeAll
    public void setupMember() {
        // 테스트 사용자 생성 및 저장 (최초 한 번만 실행)
        testMember = Member.builder()
                .username(TEST_USERNAME)
                .name("Test User")
                .password("1234")
                .email("test@example.com")
                .companyName("Test Company")
                .role(Member.Role.BUYER)
                .enabled(true)
                .build();

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(testMember.getPassword());
        testMember.setPassword(encodedPassword);

        testMember = memberRepository.save(testMember);

        logger.info("Test member created with username: {}", TEST_USERNAME);
    }

    /** 각 테스트 메서드 실행 전에 수행되는 설정 */
    @BeforeEach
    public void setup() {
        // 테스트 JWT 토큰 생성
        Collection<? extends GrantedAuthority> authorities = testMember.getAuthorities();
        testToken =
                tokenProvider.generateToken(
                        TEST_USERNAME,
                        authorities,
                        Duration.ofMinutes(30)
                );

        // Redis에 테스트 사용자 권한 정보 저장
        redisService.cacheUserAuthorities(TEST_USERNAME);

        // 테스트 프로젝트 생성 및 저장
        String projectId = UUID.randomUUID().toString();
        Project project =
                Project.builder()
//                        .projectId(projectId)
//                        .projectName("Test Project")
//                        .managerName("Test Manager")
//                        .startDate(LocalDate.now())
//                        .endDate(LocalDate.now().plusDays(7))
//                        .status(Project.ProjectStatus.IN_PROGRESS)
//                        .description("Test Project Description")
//                        .supplierStatus(SupplierStatus.PENDING)
                        .build();
        projectRepository.save(project);

        // 테스트 구매 요청 생성 및 저장
////        PurchaseRequest purchaseRequest = new PurchaseRequest();
//        purchaseRequest.setRequestName("Test Purchase Request"); // title -> requestName
////        purchaseRequest.setProjectContent("Test Description"); // description -> projectContent
////        purchaseRequest.setProject(project);
////        purchaseRequest.setMember(testMember); // Requester -> Member
//////        purchaseRequest.setStatus("초안"); // PurchaseStatus -> String
////        purchaseRequest.setBusinessBudget(1000L); // totalAmount -> businessBudget, Double -> Long
////        purchaseRequest.setRequestDate(LocalDate.now());
////        purchaseRequest.setProjectStartDate(LocalDate.now().plusDays(3)); // DeliveryDate -> ProjectStartDate
//        purchaseRequestRepository.save(purchaseRequest);

        // 테스트 결재 생성 및 저장
//        ApprovalLine approval =
//                ApprovalLine.builder()
//                        .purchaseRequest(purchaseRequest)
//                        .approver(testMember)
//                        .approvalDate(LocalDate.now())
//                        .status(ApprovalLine.ApprovalStatus.승인)
//                        .comments("Test Approval")
//                        .build();
//        approvalRepository.save(approval);
    }

    /**
     * JWT 토큰을 쿠키에 추가하는 메서드
     *
     * @param requestBuilder MockHttpServletRequestBuilder 객체
     * @return JWT 토큰이 추가된 MockHttpServletRequestBuilder 객체
     */
    private MockHttpServletRequestBuilder addJwtToken(
            MockHttpServletRequestBuilder requestBuilder
    ) {
        return requestBuilder.cookie(new MockCookie("accToken", testToken));
    }

    /**
     * 모든 Approval 목록을 가져오는 API 테스트
     *
     * @throws Exception 예외 발생 시
     */
    @Test
    void getAllApprovals_shouldReturnAllApprovals() throws Exception {
        mockMvc
                .perform(addJwtToken(get("/api/approvals")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * 특정 ID의 Approval을 가져오는 API 테스트 (Approval이 존재하는 경우)
     *
     * @throws Exception 예외 발생 시
     */
    @Test
    void getApprovalById_shouldReturnApproval_whenApprovalExists() throws Exception {
        mockMvc
                .perform(addJwtToken(get("/api/approvals/{id}", 1)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * 특정 ID의 Approval을 가져오는 API 테스트 (Approval이 존재하지 않는 경우)
     *
     * @throws Exception 예외 발생 시
     */
    @Test
    void getApprovalById_shouldReturnNotFound_whenApprovalDoesNotExist()
            throws Exception {
        mockMvc
                .perform(addJwtToken(get("/api/approvals/{id}", 3)))
                .andExpect(status().isNotFound());
    }

    /**
     * 새로운 Approval을 생성하는 API 테스트
     *
     * @throws Exception 예외 발생 시
     */
    @Test
    void createApproval_shouldCreateNewApproval() throws Exception {
        ApprovalDTO approvalDTO = new ApprovalDTO();
        approvalDTO.setPurchaseRequestId(1L);
        approvalDTO.setApproverId(1L);
        approvalDTO.setApprovalDate(LocalDate.now());
        approvalDTO.setStatus("대기");
        approvalDTO.setComments("Test Comments");

        mockMvc
                .perform(
                        addJwtToken(
                                post("/api/approvals")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(approvalDTO))
                        )
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * 기존 Approval을 업데이트하는 API 테스트 (Approval이 존재하는 경우)
     *
     * @throws Exception 예외 발생 시
     */
    @Test
    void updateApproval_shouldUpdateApproval_whenApprovalExists() throws Exception {
        ApprovalDTO approvalDTO = new ApprovalDTO();
        approvalDTO.setPurchaseRequestId(1L);
        approvalDTO.setApproverId(1L);
        approvalDTO.setApprovalDate(LocalDate.now());
        approvalDTO.setStatus("승인");
        approvalDTO.setComments("Updated Comments");

        mockMvc
                .perform(
                        addJwtToken(
                                put("/api/approvals/{id}", 1)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(approvalDTO))
                        )
                )
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}