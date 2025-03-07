package com.orbit.dto.member;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

/**
 * 목록 출력과 같은 페이지에서 페이징 관련된 정보 저장 역할.
 * - 데이터베이스 조회 시 페이징 관련 정보를 제공함.
 */
@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PageRequestDTO {

    @Builder.Default
    private int page = 1; // 페이지 번호 (0이 아닌 1부터 시작하도록 변경)
    @Builder.Default
    private int size = 20; // 한 페이지에 보여줄 데이터 개수

    private String type;       // 검색의 종류 (예: t, c, w, tc, tw, twc)
    private String keyword;    // 검색 키워드
    private String status;     // 회원 상태 (활성/탈퇴)
    private String searchType; // 검색 타입 (name, email)

    public String[] getTypes() {
        if (type == null || type.isEmpty()) {
            return null;
        }
        return type.split(""); // "tcw" -> ["t", "c", "w"]
    }

    /**
     * Pageable 객체 생성 메서드
     * @param props 정렬 기준 속성들
     * @return Pageable 객체
     */
    public Pageable getPageable(String... props) {
        return PageRequest.of(this.page - 1, this.size, Sort.by(props).descending());
    }

    private String link;

    /**
     * 페이징 링크 생성 메서드
     * @return 링크 문자열
     */
    public String getLink() {
        if (link == null) {
            StringBuilder builder = new StringBuilder();
            builder.append("page=" + this.page);
            builder.append("&size=" + this.size);
            if (type != null && !type.isEmpty()) {
                builder.append("&type=" + type);
            }
            if (keyword != null) {
                try {
                    builder.append("&keyword=" + URLEncoder.encode(keyword, "UTF-8"));
                } catch (UnsupportedEncodingException e) {
                    e.printStackTrace();
                }
            }
            link = builder.toString();
        }
        return link;
    }
}
