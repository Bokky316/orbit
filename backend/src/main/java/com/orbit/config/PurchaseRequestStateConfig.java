package com.orbit.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;

import com.orbit.aspect.ProcessEventAspects;
import com.orbit.event.handler.PurchaseRequestStateHandler;
import com.orbit.event.listener.PurchaseRequestStatusChangeListener;
import com.orbit.event.publisher.ProcessEventPublisher;
import com.orbit.util.PurchaseRequestRelationFinder;

/**
 * 구매 요청 상태 관리를 위한 설정 클래스
 * AOP 활성화 및 관련 컴포넌트 자동 등록
 */
@Configuration
@EnableAspectJAutoProxy
@Import({
        ProcessEventAspects.class,
        PurchaseRequestStateHandler.class,
        PurchaseRequestStatusChangeListener.class,
        ProcessEventPublisher.class,
        PurchaseRequestRelationFinder.class
})
public class PurchaseRequestStateConfig {
    // 빈 설정은 @Import와 컴포넌트 스캔에 의해 자동 처리
}