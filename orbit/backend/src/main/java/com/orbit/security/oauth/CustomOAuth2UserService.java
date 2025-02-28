package com.orbit.security.oauth;

import java.util.Collections;
import java.util.Map;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.orbit.entity.Member;
import com.orbit.repository.MemberRepository;
import com.orbit.security.dto.MemberSecurityDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 소셜 로그인을 통해서 인증을 진행하는 클래스
 * - 소셜 로그인 제공자로부터 사용자 정보를 가져옵니다.
 * - 사용자 정보를 사용하여 데이터베이스에서 회원 정보를 조회하거나, 없으면 새로운 회원을 생성합니다.
 * - 스프링 시큐리티의 인증 객체를 생성하고 반환합니다.
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final MemberRepository memberRepository;

    /**
     * 소셜 로그인 인증 진행 메소드
     *  - 일반 인증에서는 loadUserByUsername 메소드가 진행.
     * 파라미터인 OAuth2UserRequest 에 포함된 정보
     *   1. Registration ID : 여러 소셜 로그인 업체 중에서 어떤 업체를 사용할지 정보
     *   2. Client ID & Client Secret, Redirect URI 정보등
     *   3. 이 모든 정보는 application.properties 에 설정 해놓을것.
     */
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        /**
         * DefaultOAuth2UserService 클래스의 loadUser() 메소드 호출.
         *
         * 소셜 로그인 업체 식별번호, 소셜 로그인 Api에서 발급받은
         * 1)client-id 2)client-secret 3)Redirect-Url 정보를 담고 있는
         * userRequest 를 제공해주면  카카오 소셜 로그인을 진행해주고
         * 그 결과를 OAuth2User 객체에 담아서 보내줌.
         *
         * OAuth2User 객체에는 카카오에서 제공하는 사용자의 이메일, 이름 등의 정보 포함
         *
         * 정리하면 super.loadUser(userRequest) 호출로 카카오 소셜 로그인이
         * 진행되고 거기서 받아온 값이 OAuth2User 객체에 담겨온다. 우리는 그
         * 정보를 사용하여 데이터베이스에 소셜 로그인 관련 정보를 저장하거나
         * 업데이트하고, 시큐리티 객체를 생성하여 반환하면 된다.
         */
        OAuth2User oAuth2User = super.loadUser(userRequest);
        /**
         * oAuth2User 에서 정보를 Key-value 형태로 추출하여 map 형태로 보관.
         * 주로 이메일 또는 닉네임 정도. 소셜 업체에 따라서 다름.
         */
        Map<String, Object> attributes = oAuth2User.getAttributes();
        // 소셜 로그인 제공자 정보, 카카오, 구글, 네이버 등
        String provider = userRequest.getClientRegistration().getRegistrationId();
        // 소셜 로그인 제공자로 부터 받은 사용자 정보에서 이메일 추출
        String email = extractEmail(attributes, provider);
        // 소셜 로그인 제공자로 부터 받은 사용자 프로필 이름 추출
        String name = extractName(attributes, provider);

        // 사용자 저장 또는 업데이트(최초소셜로그인->저장, 이미소셜로그인한적있음->업데이트)
        Member member = saveOrUpdateMember(email, name, provider);
        // 시큐리티 객체 생성
        return createSecurityDto(member, attributes);
    }

    /**
     * 시큐리티 객체 생성
     * - 스프링 시큐리티 인증 객체 생성
     */
    private MemberSecurityDto createSecurityDto(Member member, Map<String, Object> attributes) {
        return new MemberSecurityDto(
                member.getId(),
                member.getEmail(),
                member.getPassword() == null ? "N/A" : member.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + member.getRole().toString())),
                member.getName(),
                member.isSocial(),
                member.getProvider(),
                attributes
        );
    }

    private String extractEmail(Map<String, Object> attributes, String provider) {
        // if ("kakao".equals(provider)) {
        //     Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        //     return (String) kakaoAccount.get("email");
        // }
        // Other providers...
        return (String) attributes.get("email");
    }

    /**
     * 카카오 닉네임 추출
     */
    private String extractName(Map<String, Object> attributes, String provider) {
        // if ("kakao".equals(provider)) {
        //     Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        //     Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
        //     String name = (String) profile.get("nickname");
        //     // 기본 사용자 이름 설정
        //     return (name != null && !name.isEmpty()) ? name : "기본사용자";
        // }
        // Other providers can be handled here if needed
        return "Unknown User"; // 기본값
    }


    /**
     * 사용자 저장 또는 업데이트
     */
    private Member saveOrUpdateMember(String email, String name, String provider) {
        Member member = memberRepository.findByEmail(email);
        if (member == null) {   // 최초로 소셜 로그인하는 사용자
            member = Member.createSocialMember(email, provider);    // 소셜 로그인 사용자 생성
            member.setName(name);   // 이름 설정
            member = memberRepository.save(member);     // 저장
        } else {    // 이미 소셜 로그인으로 데이터베이스에 관련 정보가 있는 사용자
            // 사용자가 소셜 로그인 카카오, 구글에서 이름 또는 이메일과 같은 정보를 변경했을 수 있기 때문에 업데이트
            member.setProvider(provider);               // 소셜 로그인 제공자 업데이트
            member.setName(name);                       // 이름 업데이트
            member = memberRepository.save(member);     // 업데이트(영속화)
        }
        return member;  // 사용자 반환
    }
}
