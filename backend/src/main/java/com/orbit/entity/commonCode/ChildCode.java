package com.orbit.entity.commonCode;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Converter;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "child_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChildCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 상위 코드 참조
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_code_id", nullable = false)
    private ParentCode parentCode;

    // 코드 값
    @Column(name = "code_value", nullable = false, length = 50)
    private String codeValue;

    // 코드 이름 (화면에 표시될 텍스트)
    @Column(name = "code_name", nullable = false, length = 100)
    private String codeName;

    // 코드 설명
    @Column(name = "description", length = 255)
    private String description;

    // 정렬 순서
    @Column(name = "display_order")
    private Integer displayOrder;

    // 사용 여부
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * 전체 코드 반환 (예: PROJECT-STATUS-PLANNING)
     */
    public String getFullCode() {
        return parentCode.getEntityType() + "-" +
                parentCode.getCodeGroup() + "-" +
                codeValue;
    }


    // 권한 정보를 저장할 JSON 컬럼
    @Column(name = "permissions_json", columnDefinition = "JSON")
    @Convert(converter = PermissionsJsonConverter.class)
    private Map<String, Object> permissions;

    // 알림 정보를 저장할 JSON 컬럼
    @Column(name = "notification_json", columnDefinition = "JSON")
    @Convert(converter = NotificationJsonConverter.class)
    private Map<String, Object> notificationSettings;

    // JSON 변환을 위한 컨버터 클래스들
    @Converter
    public static class PermissionsJsonConverter implements AttributeConverter<Map<String, Object>, String> {
        private static final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public String convertToDatabaseColumn(Map<String, Object> attribute) {
            try {
                return attribute == null ? null : objectMapper.writeValueAsString(attribute);
            } catch (Exception e) {
                throw new RuntimeException("권한 정보 변환 중 오류 발생", e);
            }
        }

        @Override
        public Map<String, Object> convertToEntityAttribute(String dbData) {
            try {
                return dbData == null ? new HashMap<>() : 
                    objectMapper.readValue(dbData, new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                throw new RuntimeException("권한 정보 복원 중 오류 발생", e);
            }
        }
    }

    @Converter
    public static class NotificationJsonConverter implements AttributeConverter<Map<String, Object>, String> {
        private static final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public String convertToDatabaseColumn(Map<String, Object> attribute) {
            try {
                return attribute == null ? null : objectMapper.writeValueAsString(attribute);
            } catch (Exception e) {
                throw new RuntimeException("알림 정보 변환 중 오류 발생", e);
            }
        }

        @Override
        public Map<String, Object> convertToEntityAttribute(String dbData) {
            try {
                return dbData == null ? new HashMap<>() : 
                    objectMapper.readValue(dbData, new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                throw new RuntimeException("알림 정보 복원 중 오류 발생", e);
            }
        }
    }

    // 권한 관련 헬퍼 메서드
    public int getPermissionLevel(String permissionKey) {
        if (permissions == null) return 0;
        Object level = permissions.get(permissionKey);
        return level instanceof Number ? ((Number) level).intValue() : 0;
    }

    // 알림 관련 헬퍼 메서드
    public boolean isNotificationEnabled(String notificationType) {
        if (notificationSettings == null) return false;
        Object enabled = notificationSettings.get(notificationType);
        return Boolean.TRUE.equals(enabled);
    }
}