package com.orbit.service.member;

import com.orbit.dto.member.*;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.member.LoginFormDto;
import com.orbit.dto.member.MemberDTO;
import com.orbit.dto.member.MemberFormDto;
import com.orbit.dto.member.MemberUpdateDto;
import com.orbit.dto.member.PageRequestDTO;
import com.orbit.dto.member.PageResponseDTO;
import com.orbit.entity.member.Member;
import com.orbit.entity.member.Member.Role;
import com.orbit.repository.member.MemberRepository;

import lombok.RequiredArgsConstructor;

/**
 * 회원 관리 서비스
 * 회원 가입, 로그인, 회원 조회, 수정, 탈퇴 등의 기능을 제공합니다.
 */
@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 회원가입 처리
     * @param memberFormDto 클라이언트에서 전달받은 회원가입 데이터
     * @throws IllegalStateException 이미 존재하는 username 또는 이메일로 가입 시도할 경우
     */
    @Transactional
    public void registerMember(MemberFormDto memberFormDto) {
        if (isUsernameDuplicate(memberFormDto.getUsername())) {
            throw new IllegalStateException("이미 존재하는 username입니다.");
        }
        if (isEmailDuplicate(memberFormDto.getEmail())) {
            throw new IllegalStateException("이미 존재하는 이메일입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(memberFormDto.getPassword());
        Member member = Member.createMember(memberFormDto, passwordEncoder);
        member.setPassword(encodedPassword); // 암호화된 비밀번호 설정
        memberRepository.save(member);
    }

    /**
     * username 중복 체크
     * @param username 클라이언트에서 입력받은 username
     * @return true(중복) or false(사용 가능)
     */
    public boolean isUsernameDuplicate(String username) {
        return memberRepository.findByUsername(username).isPresent();
    }

    /**
     * 이메일 중복 체크
     * @param email 클라이언트에서 입력받은 이메일
     * @return true(중복) or false(사용 가능)
     */
    public boolean isEmailDuplicate(String email) {
        return memberRepository.findByEmail(email) != null;
    }

    /**
     * 로그인 처리
     * @param loginForm 로그인 폼 데이터 (username, 비밀번호)
     * @return 로그인 성공 여부 (true: 성공, false: 실패)
     */
    /**
     * 로그인 시도
     * @param loginForm 로그인 정보
     * @return 로그인 성공 여부
     */
    @Transactional
    public boolean login(LoginFormDto loginForm) {
        Optional<Member> optionalMember = memberRepository.findByUsername(loginForm.getUsername());
        Member member = optionalMember.orElse(null);

        if (member != null && passwordEncoder.matches(loginForm.getPassword(), member.getPassword())) {
            member.setLastLoginAt(LocalDateTime.now());
            memberRepository.save(member);
            return true;
        }
        return false;
    }

    /**
     * 회원 ID로 회원 조회
     * @param memberId 조회할 회원의 ID
     * @return 조회된 회원 엔티티
     * @throws IllegalArgumentException 존재하지 않는 회원 ID로 조회 시
     */
    public Member findById(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }

    /**
     * 사용자 이름(username)으로 Member 엔티티를 조회합니다.
     * @param username 사용자 이름(username)
     * @return Member 객체
     * @throws IllegalArgumentException 사용자가 존재하지 않을 경우 예외 발생
     */
    public Member findByUsername(String username) {
        return memberRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다: " + username));
    }

    /**
     * 회원 정보 수정
     * @param memberId 수정할 회원의 ID
     * @param updateDto 수정할 회원 정보
     * @throws IllegalArgumentException 존재하지 않는 회원 ID로 수정 시도할 경우
     */
    @Transactional
    public void updateMember(Long memberId, MemberUpdateDto updateDto) {
        Member member = findById(memberId);
        if (updateDto.getName() != null) {
            member.setName(updateDto.getName());
        }
        if (updateDto.getEmail() != null) {
            member.setEmail(updateDto.getEmail());
        }
        if (updateDto.getContactNumber() != null) {
            member.setContactNumber(updateDto.getContactNumber());
        }
        if (updateDto.getCompanyName() != null) {
            member.setCompanyName(updateDto.getCompanyName());
        }
        if (updateDto.getPostalCode() != null) {
            member.setPostalCode(updateDto.getPostalCode());
        }
        if (updateDto.getRoadAddress() != null) {
            member.setRoadAddress(updateDto.getRoadAddress());
        }
        if (updateDto.getDetailAddress() != null) {
            member.setDetailAddress(updateDto.getDetailAddress());
        }

        memberRepository.save(member);
    }

    /**
     * 회원 탈퇴 (비활성화)
     * @param memberId 탈퇴할 회원의 ID
     * @throws IllegalArgumentException 존재하지 않는 회원 ID로 탈퇴 시도할 경우
     */
    @Transactional
    public void deactivateMember(Long memberId) {
        Member member = findById(memberId);
        member.deactivateMember();
        memberRepository.save(member);
    }

    /**
     * 회원 목록 조회 (페이징, 검색 기능 포함)
     * @param pageRequestDTO 페이징 및 검색 조건
     * @return 페이징된 회원 목록
     */
    @Transactional(readOnly = true)
    public PageResponseDTO<Member> getMemberList(PageRequestDTO pageRequestDTO) {
        Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize());

        Specification<Member> spec = Specification.where(null);

        if (pageRequestDTO.getKeyword() != null && !pageRequestDTO.getKeyword().isEmpty()) {
            if ("username".equals(pageRequestDTO.getSearchType())) {
                spec = spec.and((root, query, criteriaBuilder) ->
                        criteriaBuilder.like(root.get("username"), "%" + pageRequestDTO.getKeyword() + "%"));
            } else if ("name".equals(pageRequestDTO.getSearchType())) {
                spec = spec.and((root, query, criteriaBuilder) ->
                        criteriaBuilder.like(root.get("name"), "%" + pageRequestDTO.getKeyword() + "%"));
            }
        }

        Page<Member> result = memberRepository.findAll(spec, pageable);

        return new PageResponseDTO<>(
                pageRequestDTO,
                result.getContent(),
                (int) result.getTotalElements()
        );
    }

    /**
     * 이름으로 회원 검색
     * @param name 검색할 이름
     * @return 검색된 회원 목록
     */
    public List<Member> searchMembersByName(String name) {
        return memberRepository.findByNameContainingIgnoreCase(name);
    }

    /**
     * 회원 정보를 DTO로 변환하여 반환
     * @param memberId 조회할 회원의 ID
     * @return MemberDTO 객체
     * @throws IllegalArgumentException 존재하지 않는 회원 ID로 조회 시
     */
    public MemberDTO getMemberDTO(Long memberId) {
        Member member = findById(memberId);
        return convertToDTO(member);
    }

    /**
     * 회원 목록을 페이징하여 DTO 리스트로 반환
     * @param pageRequestDTO 페이징 및 검색 조건
     * @return 페이징된 MemberDTO 목록
     */
    @Transactional(readOnly = true)
    public PageResponseDTO<MemberDTO> getMemberDTOList(PageRequestDTO pageRequestDTO) {
        Pageable pageable = pageRequestDTO.getPageable("id");

        Specification<Member> spec = Specification.where(null);

        // 검색 조건 처리
        if (pageRequestDTO.getKeyword() != null && !pageRequestDTO.getKeyword().isEmpty()) {
            if ("username".equals(pageRequestDTO.getSearchType())) {
                spec = spec.and((root, query, criteriaBuilder) ->
                        criteriaBuilder.like(root.get("username"), "%" + pageRequestDTO.getKeyword() + "%"));
            } else if ("name".equals(pageRequestDTO.getSearchType())) {
                spec = spec.and((root, query, criteriaBuilder) ->
                        criteriaBuilder.like(root.get("name"), "%" + pageRequestDTO.getKeyword() + "%"));
            } else if ("email".equals(pageRequestDTO.getSearchType())) {
                spec = spec.and((root, query, criteriaBuilder) ->
                        criteriaBuilder.like(root.get("email"), "%" + pageRequestDTO.getKeyword() + "%"));
            }
        }

        // 회원 상태 필터링 (활성/비활성)
        if (pageRequestDTO.getStatus() != null && !pageRequestDTO.getStatus().isEmpty()) {
            boolean enabled = "active".equals(pageRequestDTO.getStatus());
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("enabled"), enabled));
        }

        Page<Member> result = memberRepository.findAll(spec, pageable);

        List<MemberDTO> dtoList = result.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageResponseDTO<>(
                pageRequestDTO,
                dtoList,
                (int) result.getTotalElements()
        );
    }

    /**
     * Member 엔티티를 MemberDTO로 변환
     * @param member Member 엔티티
     * @return MemberDTO 객체
     */
    private MemberDTO convertToDTO(Member member) {
        MemberDTO.DepartmentInfo departmentInfo = null;
        if (member.getDepartment() != null) {
            departmentInfo = MemberDTO.DepartmentInfo.builder()
                    .id(member.getDepartment().getId())
                    .name(member.getDepartment().getName())
                    .code(member.getDepartment().getCode())
                    .build();
        }

        MemberDTO.PositionInfo positionInfo = null;
        if (member.getPosition() != null) {
            positionInfo = MemberDTO.PositionInfo.builder()
                    .id(member.getPosition().getId())
                    .name(member.getPosition().getName())
                    .level(member.getPosition().getLevel())
                    .build();
        }

        return MemberDTO.builder()
                .id(member.getId())
                .username(member.getUsername())
                .name(member.getName())
                .email(member.getEmail())
                .contactNumber(member.getContactNumber())
                .companyName(member.getCompanyName())
                .enabled(member.isEnabled())
                .role(member.getRole().name())
                .department(departmentInfo)
                .position(positionInfo)
                .build();
    }

    /**
     * 회원 활성화/비활성화 상태 토글
     * @param memberId 토글할 회원의 ID
     * @return 변경된 활성화 상태 (true: 활성화, false: 비활성화)
     */
    @Transactional
    public boolean toggleMemberStatus(Long memberId) {
        Member member = findById(memberId);

        if (member.isEnabled()) {
            member.deactivateMember();
        } else {
            member.activateMember();
        }

        memberRepository.save(member);
        return member.isEnabled();
    }

    /**
     * 회원 역할 변경
     * @param memberId 역할을 변경할 회원의 ID
     * @param roleName 변경할 역할명 (BUYER, SUPPLIER, ADMIN)
     * @throws IllegalArgumentException 잘못된 역할명이 전달된 경우
     */
    @Transactional
    public void updateMemberRole(Long memberId, String roleName) {
        Member member = findById(memberId);

        try {
            Role role = Role.valueOf(roleName.toUpperCase());
            member.setRole(role);
            memberRepository.save(member);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 역할입니다: " + roleName);
        }
    }

    /**
     * 회원 정보를 DTO로 변환하여 반환
     * @param memberId 조회할 회원의 ID
     * @return MemberDTO 객체
     * @throws IllegalArgumentException 존재하지 않는 회원 ID로 조회 시
     */
    public MemberDTO getMemberDTO(Long memberId) {
        Member member = findById(memberId);
        return convertToDTO(member);
    }

    /**
     * 회원 목록을 페이징하여 DTO 리스트로 반환
     * @param pageRequestDTO 페이징 및 검색 조건
     * @return 페이징된 MemberDTO 목록
     */
    @Transactional(readOnly = true)
    public PageResponseDTO<MemberDTO> getMemberDTOList(PageRequestDTO pageRequestDTO) {
        Pageable pageable = pageRequestDTO.getPageable("id");

        Specification<Member> spec = Specification.where(null);

        // 검색 조건 처리
        if (pageRequestDTO.getKeyword() != null && !pageRequestDTO.getKeyword().isEmpty()) {
            if ("username".equals(pageRequestDTO.getSearchType())) {
                spec = spec.and((root, query, criteriaBuilder) ->
                        criteriaBuilder.like(root.get("username"), "%" + pageRequestDTO.getKeyword() + "%"));
            } else if ("name".equals(pageRequestDTO.getSearchType())) {
                spec = spec.and((root, query, criteriaBuilder) ->
                        criteriaBuilder.like(root.get("name"), "%" + pageRequestDTO.getKeyword() + "%"));
            } else if ("email".equals(pageRequestDTO.getSearchType())) {
                spec = spec.and((root, query, criteriaBuilder) ->
                        criteriaBuilder.like(root.get("email"), "%" + pageRequestDTO.getKeyword() + "%"));
            }
        }

        // 회원 상태 필터링 (활성/비활성)
        if (pageRequestDTO.getStatus() != null && !pageRequestDTO.getStatus().isEmpty()) {
            boolean enabled = "active".equals(pageRequestDTO.getStatus());
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("enabled"), enabled));
        }

        Page<Member> result = memberRepository.findAll(spec, pageable);

        List<MemberDTO> dtoList = result.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageResponseDTO<>(
                pageRequestDTO,
                dtoList,
                (int) result.getTotalElements()
        );
    }

    /**
     * Member 엔티티를 MemberDTO로 변환
     * @param member Member 엔티티
     * @return MemberDTO 객체
     */
    private MemberDTO convertToDTO(Member member) {
        MemberDTO.DepartmentInfo departmentInfo = null;
        if (member.getDepartment() != null) {
            departmentInfo = MemberDTO.DepartmentInfo.builder()
                    .id(member.getDepartment().getId())
                    .name(member.getDepartment().getName())
                    .code(member.getDepartment().getCode())
                    .build();
        }

        MemberDTO.PositionInfo positionInfo = null;
        if (member.getPosition() != null) {
            positionInfo = MemberDTO.PositionInfo.builder()
                    .id(member.getPosition().getId())
                    .name(member.getPosition().getName())
                    .level(member.getPosition().getLevel())
                    .build();
        }

        return MemberDTO.builder()
                .id(member.getId())
                .username(member.getUsername())
                .name(member.getName())
                .email(member.getEmail())
                .contactNumber(member.getContactNumber())
                .companyName(member.getCompanyName())
                .enabled(member.isEnabled())
                .role(member.getRole().name())
                .department(departmentInfo)
                .position(positionInfo)
                .build();
    }

    /**
     * 회원 활성화/비활성화 상태 토글
     * @param memberId 토글할 회원의 ID
     * @return 변경된 활성화 상태 (true: 활성화, false: 비활성화)
     */
    @Transactional
    public boolean toggleMemberStatus(Long memberId) {
        Member member = findById(memberId);

        if (member.isEnabled()) {
            member.deactivateMember();
        } else {
            member.activateMember();
        }

        memberRepository.save(member);
        return member.isEnabled();
    }

    /**
     * 회원 역할 변경
     * @param memberId 역할을 변경할 회원의 ID
     * @param roleName 변경할 역할명 (BUYER, SUPPLIER, ADMIN)
     * @throws IllegalArgumentException 잘못된 역할명이 전달된 경우
     */
    @Transactional
    public void updateMemberRole(Long memberId, String roleName) {
        Member member = findById(memberId);

        try {
            Member.Role role = Member.Role.valueOf(roleName.toUpperCase());
            member.setRole(role);
            memberRepository.save(member);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 역할입니다: " + roleName);
        }
    }
}
