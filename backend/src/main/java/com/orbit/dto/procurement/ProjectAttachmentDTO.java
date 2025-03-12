package com.orbit.dto.procurement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectAttachmentDTO {

    private Long id;
    private String fileName;
    private Long fileSize;
    private String fileExtension;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
    private String description;
}