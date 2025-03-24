import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetRealTimeNotifications } from "@/redux/notificationSlice";

/**
 * 토스트 알림을 관리하는 커스텀 훅
 * 실시간 알림이 도착했을 때 토스트 메시지를 표시합니다.
 */
export function useToastNotifications() {
  const dispatch = useDispatch();

  // Redux의 실시간 알림 상태 가져오기
  const realTimeNotifications = useSelector(
    (state) => state.notifications?.realTimeNotifications || []
  );

  // 현재 표시 중인 토스트 상태
  const [visibleToast, setVisibleToast] = useState(null);
  const toastTimerRef = useRef(null);

  // 토스트 알림 표시 효과
  useEffect(() => {
    // 새 알림이 있고 현재 표시 중인 알림이 없을 때만 처리
    if (realTimeNotifications.length > 0 && !visibleToast) {
      // 최신 알림 가져오기
      const latestNotification = realTimeNotifications[0];
      setVisibleToast(latestNotification);

      // 일정 시간 후 토스트 숨기기 (5초)
      toastTimerRef.current = setTimeout(() => {
        setVisibleToast(null);
        dispatch(resetRealTimeNotifications());
      }, 5000);
    }

    // 컴포넌트 언마운트 또는 의존성 변경 시 타이머 정리
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [realTimeNotifications, visibleToast, dispatch]);

  // 토스트 수동 닫기 메서드
  const closeToast = useCallback(() => {
    setVisibleToast(null);
    dispatch(resetRealTimeNotifications());

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
  }, [dispatch]);

  // 알림 타입에 기반한 스타일 정보 제공
  const getToastStyle = useCallback((notification) => {
    if (!notification)
      return {
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: "info-circle"
      };

    const type = notification.type || "";

    // 알림 타입별 스타일 매핑
    if (type.includes("ERROR") || type.includes("CANCELED")) {
      return {
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        icon: "exclamation-circle"
      };
    } else if (type.includes("WARNING")) {
      return {
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        icon: "exclamation-triangle"
      };
    } else if (
      type.includes("SUCCESS") ||
      type.includes("COMPLETED") ||
      type.includes("APPROVED")
    ) {
      return {
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        icon: "check-circle"
      };
    } else if (type.includes("BIDDING") || type.includes("CONTRACT")) {
      return {
        bgColor: "bg-indigo-100",
        textColor: "text-indigo-800",
        icon: "file-contract"
      };
    } else {
      return {
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: "info-circle"
      };
    }
  }, []);

  // 알림 우선순위에 따른 자동 닫기 시간 조정
  useEffect(() => {
    if (visibleToast) {
      const priority = visibleToast.priority || "NORMAL";
      let timeout = 5000; // 기본 5초

      if (priority === "HIGH") {
        timeout = 8000; // 높은 우선순위는 8초
      } else if (priority === "LOW") {
        timeout = 3000; // 낮은 우선순위는 3초
      }

      // 이전 타이머 제거 후 새 타이머 설정
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = setTimeout(() => {
        setVisibleToast(null);
        dispatch(resetRealTimeNotifications());
      }, timeout);
    }

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [visibleToast, dispatch]);

  // 반환값: 현재 토스트, 닫기 메서드, 스타일 함수
  return {
    toast: visibleToast,
    closeToast,
    getToastStyle
  };
}
