package com.orbit.security.oauth;

import com.orbit.entity.Member;
import com.orbit.repository.MemberRepository;
import com.orbit.security.dto.MemberSecurityDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Log4j2
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final MemberRepository memberRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String provider = userRequest.getClientRegistration().getRegistrationId();
        String email = extractEmail(attributes, provider);
        String name = extractName(attributes, provider);

        Member member = saveOrUpdateMember(email, name, provider);
        return createSecurityDto(member, attributes);
    }

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
        if ("kakao".equals(provider)) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            return (String) kakaoAccount.get("email");
        }
        return (String) attributes.get("email");
    }

    private String extractName(Map<String, Object> attributes, String provider) {
        if ("kakao".equals(provider)) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            String name = (String) profile.get("nickname");
            return (name != null && !name.isEmpty()) ? name : "기본사용자";
        }
        return "Unknown User";
    }

    private Member saveOrUpdateMember(String email, String name, String provider) {
        return memberRepository.findByEmail(email)
                .map(member -> {
                    member.setProvider(provider);
                    member.setName(name);
                    return memberRepository.save(member);
                })
                .orElseGet(() -> {
                    Member newMember = Member.createSocialMember(email, provider);
                    newMember.setName(name);
                    return memberRepository.save(newMember);
                });
    }
}