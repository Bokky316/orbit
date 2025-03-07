package com.orbit.dto.member;

import com.orbit.dto.member.PageRequestDTO;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.util.List;

/**
 * 페이징 처리에 필요한 정보를 포함하고 응답 데이터(목록)를 담기 위한 DTO 클래스.
 */
@Getter
@ToString
public class PageResponseDTO<E> {

    private int page;      // 현재 페이지 번호
    private int size;      // 한 페이지당 데이터 개수
    private int total;     // 전체 데이터 개수

    private int start;     // 시작 페이지 번호
    private int end;       // 끝 페이지 번호

    private boolean prev;  // 이전 페이지 존재 여부
    private boolean next;  // 다음 페이지 존재 여부

    private List<E> dtoList; // 페이지에 보여줄 목록 데이터

    /**
     * PageResponseDTO 생성자
     * @param pageRequestDTO 클라이언트 요청 DTO
     * @param dtoList 목록 데이터
     * @param total 전체 데이터 개수
     */
    @Builder
    public PageResponseDTO(PageRequestDTO pageRequestDTO,
                           List<E> dtoList,
                           int total) {
        if (total <= 0) {
            return;
        }

        this.page = pageRequestDTO.getPage();
        this.size = pageRequestDTO.getSize();
        this.total = total;

        this.dtoList = dtoList;

        this.end = (int) (Math.ceil(this.page / 10.0)) * 10;
        this.start = this.end - 9;

        int last = (int) Math.ceil((double) total / this.size);
        this.end = Math.min(this.end, last);

        this.prev = this.start > 1;
        this.next = total > this.end * this.size;
    }
}
