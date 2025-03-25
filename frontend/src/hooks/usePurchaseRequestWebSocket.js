// src/hooks/usePurchaseRequestWebSocket.js
import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { SERVER_URL } from '../utils/constants';
import {
  fetchDashboardData,
  fetchRequestProgress,
  fetchRequestsByProject,
  receiveWebsocketUpdate
} from '../redux/purchaseRequestDashboardSlice';

/**
 * 구매요청 관련 WebSocket 연결 관리 훅
 * @param {Object} user 현재 로그인한 사용자 정보
 * @param {Object} options 구독 옵션 (requestId, projectId 등)
 * @returns {Object} { isConnected, sendStatusChange }
 */
const usePurchaseRequestWebSocket = (user, options = {}) => {
  const dispatch = useDispatch();
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  // useRef를 사용하여 subscriptions 관리 - 렌더링 유발 방지
  const subscriptionsRef = useRef([]);

  // 구독 설정 함수 - useCallback으로 메모이제이션
  const setupSubscriptions = useCallback((client) => {
    if (!client || !client.connected) return;

    // 기존 구독 초기화
    subscriptionsRef.current.forEach(subscription => {
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.error('구독 해제 오류:', error);
      }
    });

    subscriptionsRef.current = [];
    const newSubscriptions = [];

    // 대시보드 갱신 구독
    newSubscriptions.push(
      client.subscribe('/topic/purchase-request-dashboard', (message) => {
        const body = message.body;
        if (body === 'refresh') {
          dispatch(fetchDashboardData());
        }
      })
    );

    // 대시보드 데이터 직접 수신 구독
    newSubscriptions.push(
      client.subscribe('/topic/purchase-request-dashboard/data', (message) => {
        try {
          const dashboardData = JSON.parse(message.body);
          dispatch(receiveWebsocketUpdate({
            type: 'dashboard',
            data: dashboardData
          }));
        } catch (error) {
          console.error('대시보드 데이터 파싱 오류:', error);
        }
      })
    );

    // 특정 구매요청 구독 (옵션으로 전달된 경우)
    if (options.requestId) {
      // 구매요청 진행 상태 구독
      newSubscriptions.push(
        client.subscribe(`/topic/purchase-request-progress/${options.requestId}`, (message) => {
          const body = message.body;
          if (body === 'refresh') {
            dispatch(fetchRequestProgress(options.requestId));
          } else {
            try {
              const progressData = JSON.parse(message.body);
              dispatch(receiveWebsocketUpdate({
                type: 'progress',
                data: progressData
              }));
            } catch (e) {
              console.error('진행 상태 데이터 파싱 오류:', e);
            }
          }
        })
      );

      // 구매요청 상태 변경 구독
      newSubscriptions.push(
        client.subscribe(`/topic/purchase-request/${options.requestId}`, (message) => {
          try {
            const updateData = JSON.parse(message.body);
            console.log('구매요청 상태 업데이트 수신:', updateData);

            // 상태 변경 후 데이터 갱신
            dispatch(fetchRequestProgress(options.requestId));
            dispatch(fetchDashboardData());
          } catch (error) {
            console.error('상태 업데이트 처리 오류:', error);
          }
        })
      );
    }

    // 프로젝트별 구매요청 목록 구독 (옵션으로 전달된 경우)
    if (options.projectId) {
      newSubscriptions.push(
        client.subscribe(`/topic/project-purchase-requests/${options.projectId}`, (message) => {
          const body = message.body;
          if (body === 'refresh') {
            dispatch(fetchRequestsByProject(options.projectId));
          }
        })
      );
    }

    // 개인 알림 구독
    if (user?.username) {
      newSubscriptions.push(
        client.subscribe(`/user/${user.username}/queue/notifications`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('개인 알림 수신:', notification);
            // 알림 처리 로직 (토스트 메시지 등)
          } catch (error) {
            console.error('알림 처리 오류:', error);
          }
        })
      );
    }

    // 구독 목록 업데이트 - ref에 저장
    subscriptionsRef.current = newSubscriptions;
  }, [dispatch, options.projectId, options.requestId, user?.username]);

  // 이전 옵션 값 저장용 ref
  const prevOptionsRef = useRef(null);
  const prevUserRef = useRef(null);

  // WebSocket 연결 설정
  useEffect(() => {
    if (!user?.id) return;

    // 옵션이나 사용자가 변경되었는지 확인
    const optionsChanged = JSON.stringify(options) !== JSON.stringify(prevOptionsRef.current);
    const userChanged = user?.id !== prevUserRef.current?.id;

    // 변경이 없으면 재연결하지 않음
    if (!optionsChanged && !userChanged && stompClient) {
      return;
    }

    // 현재 값 기억
    prevOptionsRef.current = {...options};
    prevUserRef.current = {...user};

    // 이전 구독 정리 함수
    const cleanupSubscriptions = () => {
      subscriptionsRef.current.forEach(subscription => {
        try {
          if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
          }
        } catch (error) {
          console.error('구독 해제 오류:', error);
        }
      });
      subscriptionsRef.current = [];
    };

    // 이전 클라이언트가 있다면 연결 해제
    if (stompClient && stompClient.active) {
      stompClient.deactivate();
      setStompClient(null);
      setIsConnected(false);
    }

    // SERVER_URL 디버깅
    console.log('SERVER_URL:', SERVER_URL);

    // WebSocket URL 구성 및 디버깅
    const wsUrl = SERVER_URL.endsWith('/')
      ? SERVER_URL + 'ws'
      : SERVER_URL + '/ws';
    console.log('WebSocket URL:', wsUrl);

    // WebSocket 연결 생성
    const socket = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: process.env.NODE_ENV === 'development' ? console.log : null,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('WebSocket 연결 성공');
        setIsConnected(true);
        setupSubscriptions(client);
      },

      onStompError: (frame) => {
        console.error('WebSocket 연결 오류:', frame);
        setIsConnected(false);
        cleanupSubscriptions();
      },

      onDisconnect: () => {
        console.log('WebSocket 연결 해제');
        setIsConnected(false);
        cleanupSubscriptions();
      }
    });

    client.activate();
    setStompClient(client);

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      cleanupSubscriptions();
      if (client && client.active) {
        client.deactivate();
      }
    };
  }, [user?.id, setupSubscriptions, options.requestId, options.projectId, stompClient]);

  // 구매요청 상태 변경 함수
  const sendStatusChange = useCallback((purchaseRequestId, toStatus) => {
    if (!stompClient || !isConnected) {
      console.warn('WebSocket 연결이 활성화되지 않았습니다.');
      return false;
    }

    try {
      stompClient.publish({
        destination: '/app/purchase-request/status',
        body: JSON.stringify({
          purchaseRequestId,
          toStatus
        })
      });
      return true;
    } catch (error) {
      console.error('상태 변경 메시지 전송 실패:', error);
      return false;
    }
  }, [stompClient, isConnected]);

  return {
    isConnected,
    sendStatusChange
  };
};

export default usePurchaseRequestWebSocket;