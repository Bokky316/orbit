// src/pages/procurement/PurchaseRequestDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, Container, Row, Col, Tabs, Tab, Spinner, Alert, Button } from 'react-bootstrap';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// 별칭 경로를 사용하여 임포트
import { SERVER_URL } from '@utils/constants';
import { getUserFromLocalStorage } from '@utils/authUtil';

// 별칭 경로를 사용한 리덕스 슬라이스 임포트
import {
  fetchDashboardData,
  fetchFilteredRequests,
  fetchAllDepartments,
  fetchAllStatusCodes,
  receiveWebsocketUpdate
} from '@redux/purchaseRequestDashboardSlice';

// 별칭 경로를 사용한 컴포넌트 임포트
import StatusSummary from '@components/procurement/dashboard/StatusSummary';
import DepartmentSummary from '@components/procurement/dashboard/DepartmentSummary';
import RecentRequestsList from '@components/procurement/dashboard/RecentRequestsList';
import PendingRequestsList from '@components/procurement/dashboard/PendingRequestsList';
import BudgetSummary from '@components/procurement/dashboard/BudgetSummary';
import FilterPanel from '@components/procurement/dashboard/FilterPanel';
import RequestsTable from '@components/procurement/dashboard/RequestsTable';

// WebSocket 사용 비활성화 플래그 - 문제 해결 시까지 대시보드의 기본 기능만 활성화
const USE_WEBSOCKET = false;

const PurchaseRequestDashboard = () => {
  const dispatch = useDispatch();
  const { dashboard, filteredRequests, departments, statusCodes, loading, error } = useSelector(
    (state) => state.purchaseRequestDashboard || {
      dashboard: {
        totalCount: 0,
        countByStatus: {},
        budgetByStatus: {},
        countByDepartment: {},
        budgetByDepartment: {},
        recentRequests: [],
        pendingRequests: [],
        totalBudget: 0,
        completedBudget: 0,
        pendingBudget: 0
      },
      filteredRequests: [],
      departments: [],
      statusCodes: [],
      loading: false,
      error: null
    }
  );

  const user = useSelector(state => state.auth?.user) || getUserFromLocalStorage();

  const [filters, setFilters] = useState({
    status: '',
    department: '',
    fromDate: '',
    toDate: '',
    projectId: '',
    businessType: ''
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [wsConnected, setWsConnected] = useState(false);
  const [manualRefresh, setManualRefresh] = useState(0); // 수동 새로고침 카운터

  // WebSocket 클라이언트 및 초기화 상태 관리
  const wsClientRef = useRef(null);
  const isInitializedRef = useRef(false);

  // 초기 데이터 로드 및 WebSocket 연결
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('대시보드 초기화');

    // 초기 데이터 로드
    dispatch(fetchDashboardData());
    dispatch(fetchAllDepartments());
    dispatch(fetchAllStatusCodes());

    // 리소스 정리
    return () => {
      isInitializedRef.current = false;
    };
  }, [dispatch]);

  // WebSocket 연결 별도 관리 - 비활성화 (문제 해결 시까지 주석 처리)
  useEffect(() => {
    if (!USE_WEBSOCKET || !user?.id) return;

    let client = null;
    let isActive = true;

    try {
      // WebSocket URL 구성
      const wsUrl = SERVER_URL.endsWith('/')
        ? SERVER_URL + 'ws'
        : SERVER_URL + '/ws';

      console.log('WebSocket 연결 시도:', wsUrl);

      // WebSocket 연결 생성
      const socket = new SockJS(wsUrl);
      client = new Client({
        webSocketFactory: () => socket,
        // debug 옵션을 올바르게 설정 - null이나 false가 아닌 빈 함수로 설정
        debug: () => {},
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
          if (!isActive) return;
          console.log('WebSocket 연결 성공');
          setWsConnected(true);
        },

        onStompError: (frame) => {
          if (!isActive) return;
          console.error('WebSocket 연결 오류:', frame);
          setWsConnected(false);
        },

        onDisconnect: () => {
          if (!isActive) return;
          console.log('WebSocket 연결 해제');
          setWsConnected(false);
        }
      });

      client.activate();
      wsClientRef.current = client;
    } catch (error) {
      console.error('WebSocket 초기화 오류:', error);
    }

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      isActive = false;
      if (client && client.active) {
        try {
          client.deactivate();
        } catch (err) {
          console.error('WebSocket 연결 해제 오류:', err);
        }
      }
      wsClientRef.current = null;
    };
  }, [user?.id]);

  // 수동 새로고침 시 데이터 로드
  useEffect(() => {
    if (manualRefresh > 0) {
      dispatch(fetchDashboardData());
    }
  }, [manualRefresh, dispatch]);

  // 수동 새로고침 핸들러
  const handleManualRefresh = () => {
    setManualRefresh(prev => prev + 1);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (name, value) => {
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  // 필터 검색 핸들러
  const handleFilterSubmit = () => {
    // 필터 객체의 복사본 생성하여 전달
    const filtersCopy = { ...filters };
    dispatch(fetchFilteredRequests(filtersCopy));
    setActiveTab('filtered');
  };

  // 필터 초기화 핸들러
  const handleFilterReset = () => {
    setFilters({
      status: '',
      department: '',
      fromDate: '',
      toDate: '',
      projectId: '',
      businessType: ''
    });
  };

  // 로딩 표시
  if (loading && (!dashboard || Object.keys(dashboard).length === 0)) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">로딩 중...</span>
        </Spinner>
      </Container>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <Container className="py-3">
        <Alert variant="danger">
          <Alert.Heading>오류가 발생했습니다</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">구매요청 대시보드</h2>
        <div className="d-flex align-items-center">
          <Button variant="primary" onClick={handleManualRefresh} className="me-2">
            <i className="bi bi-arrow-clockwise"></i> 데이터 새로고침
          </Button>
          {USE_WEBSOCKET && (
            <span className={`badge ${wsConnected ? 'bg-success' : 'bg-danger'} me-2`}>
              {wsConnected ? '서버 연결됨' : '서버 연결 끊김'}
            </span>
          )}
          <small className="text-muted">마지막 업데이트: {format(new Date(), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}</small>
        </div>
      </div>

      <FilterPanel
        filters={filters}
        departments={departments || []}
        statusCodes={statusCodes || []}
        onFilterChange={handleFilterChange}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
      />

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="overview" title="대시보드 개요">
          <Row className="mb-4">
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">구매요청 상태별 현황</h5>
                </Card.Header>
                <Card.Body>
                  <StatusSummary
                    countByStatus={dashboard.countByStatus || {}}
                    budgetByStatus={dashboard.budgetByStatus || {}}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">부서별 현황</h5>
                </Card.Header>
                <Card.Body>
                  <DepartmentSummary
                    countByDepartment={dashboard.countByDepartment || {}}
                    budgetByDepartment={dashboard.budgetByDepartment || {}}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">예산 현황</h5>
                </Card.Header>
                <Card.Body>
                  <BudgetSummary
                    totalBudget={dashboard.totalBudget || 0}
                    completedBudget={dashboard.completedBudget || 0}
                    pendingBudget={dashboard.pendingBudget || 0}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">최근 구매요청</h5>
                </Card.Header>
                <Card.Body>
                  <RecentRequestsList requests={dashboard.recentRequests || []} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">처리 대기중인 요청</h5>
                </Card.Header>
                <Card.Body>
                  <PendingRequestsList requests={dashboard.pendingRequests || []} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="filtered" title="필터링된 목록">
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">필터링된 구매요청 목록</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">로딩 중...</span>
                  </Spinner>
                </div>
              ) : (
                <RequestsTable requests={filteredRequests || []} />
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {!USE_WEBSOCKET && (
        <Alert variant="warning" className="mt-3">
          <Alert.Heading>실시간 업데이트 비활성화</Alert.Heading>
          <p>현재 실시간 WebSocket 연결이 비활성화되어 있습니다. 데이터 업데이트를 위해 '데이터 새로고침' 버튼을 사용하세요.</p>
        </Alert>
      )}
    </Container>
  );
};

export default PurchaseRequestDashboard;