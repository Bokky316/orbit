package com.orbit.repository.procurement;

import com.orbit.entity.project.ProjectAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectAttachmentRepository extends JpaRepository<ProjectAttachment, Long> {

    /**
     * 특정 프로젝트의 모든 첨부파일 조회
     */
    List<ProjectAttachment> findByProjectId(Long projectId);

    /**
     * 특정 업로더가 업로드한 모든 첨부파일 조회
     */
    List<ProjectAttachment> findByUploadedById(Long uploaderId);

    /**
     * 특정 프로젝트의 첨부파일 삭제
     */
    void deleteByProjectId(Long projectId);
}