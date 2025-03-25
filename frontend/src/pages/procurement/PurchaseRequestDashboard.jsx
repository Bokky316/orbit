// src/pages/procurement/PurchaseRequestDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import {
  Box,
  Container,
  Grid,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';

import { Search, Refresh } from '@mui/icons-material';

// 별칭 경로를 사용하여 임포트
import { SERVER_URL } from '@utils/constants';
import { getUserFromLocalStorage } from '@utils/authUtil';

// 별칭 경로를 사용한 리덕스 슬라이스 임포트
import {
  fetchDashboardData,
  fetchFilteredRequests,
  fetchAllDepartments,
  fetchAllStatusCodes
} from '@redux/purchaseRequestDashboardSlice';

// Material UI 스타일로 변경된 컴포넌트 임포트
import StatusSummary from '@components/procurement/dashboard/StatusSummary';
import DepartmentSummary from '@components/procurement/dashboard/DepartmentSummary';
import RecentRequestsList from '@components/procurement/dashboard/RecentRequestsList';
import PendingRequestsList from '@components/procurement/dashboard/PendingRequestsList';
import BudgetSummary from '@components/procurement/dashboard/BudgetSummary';
import FilterPanel from '@components/procurement/dashboard/FilterPanel';
import RequestsTable from '@components/procurement/dashboard/RequestsTable';

// WebSocket 사용 비활성화 플래그
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

  const [filters, setFilters] = useState({
    status: '',
    department: '',
    fromDate: '',
    toDate: '',
    projectId: '',
    businessType: ''
  });

  const [manualRefresh, setManualRefresh] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const isInitializedRef = useRef(false);

  // 초기 데이터 로드
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    dispatch(fetchDashboardData());
    dispatch(fetchAllDepartments());
    dispatch(fetchAllStatusCodes());

    return () => {
      isInitializedRef.current = false;
    };
  }, [dispatch]);

  // 수동 새로고침 시 데이터 로드
  useEffect(() => {
    if (manualRefresh > 0) {
      dispatch(fetchDashboardData());
    }
  }, [manualRefresh, dispatch]);

  // 필터 변경 핸들러
  const handleFilterChange = (name, value) => {
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  // 필터 검색 핸들러
  const handleFilterSubmit = () => {
    dispatch(fetchFilteredRequests({ ...filters }));
    setTabValue(1);
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

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 수동 새로고침 핸들러
  const handleManualRefresh = () => {
    setManualRefresh(prev => prev + 1);
  };

  // 로딩 표시
  if (loading && (!dashboard || Object.keys(dashboard).length === 0)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        <Typography variant="h6">오류가 발생했습니다</Typography>
        <Typography>{error}</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ py: 3, px: 2, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 헤더 부분 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          구매요청 대시보드
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleManualRefresh}
            size="small"
            sx={{
              bgcolor: '#FF7A45',
              '&:hover': {
                bgcolor: '#FF6636'
              }
            }}
          >
            데이터 새로고침
          </Button>
          <Typography variant="body2" color="text.secondary">
            마지막 업데이트: {format(new Date(), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
          </Typography>
        </Box>
      </Box>

      {/* 필터 패널 */}
      <FilterPanel
        filters={filters}
        departments={departments || []}
        statusCodes={statusCodes || []}
        onFilterChange={handleFilterChange}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
      />

      {/* 탭 메뉴 */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              color: '#666',
              '&.Mui-selected': {
                color: '#FF7A45'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FF7A45',
              height: 3
            }
          }}
        >
          <Tab label="개요" />
          <Tab label="필터링된 목록" />
        </Tabs>
      </Box>

      {/* 탭 내용 */}
      {tabValue === 0 ? (
        // 개요 탭
        <Grid container spacing={2}>
          {/* 총 예산 카드 */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ mb: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>총 예산 현황</Typography>
                <BudgetSummary
                  totalBudget={dashboard.totalBudget || 0}
                  completedBudget={dashboard.completedBudget || 0}
                  pendingBudget={dashboard.pendingBudget || 0}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* 구매요청 상태별 현황 카드 */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ mb: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>구매요청 상태별 현황</Typography>
                <StatusSummary
                  countByStatus={dashboard.countByStatus || {}}
                  budgetByStatus={dashboard.budgetByStatus || {}}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* 부서별 현황 카드 */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ mb: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>부서별 현황</Typography>
                <DepartmentSummary
                  countByDepartment={dashboard.countByDepartment || {}}
                  budgetByDepartment={dashboard.budgetByDepartment || {}}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* 최근 구매요청 카드 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>최근 구매요청</Typography>
                <RecentRequestsList requests={dashboard.recentRequests || []} />
              </CardContent>
            </Card>
          </Grid>

          {/* 처리 대기 중인 요청 카드 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>처리 대기 중인 요청</Typography>
                <PendingRequestsList requests={dashboard.pendingRequests || []} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        // 필터링된 목록 탭
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">필터링된 구매요청 목록</Typography>
              <TextField
                placeholder="요청명 검색"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 250 }}
              />
            </Box>

            <RequestsTable
              requests={filteredRequests}
              loading={loading}
              searchTerm={searchTerm}
            />
          </CardContent>
        </Card>
      )}

      {/* WebSocket 경고 */}
      {!USE_WEBSOCKET && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">실시간 업데이트 비활성화</Typography>
          <Typography variant="body2">
            현재 실시간 WebSocket 연결이 비활성화되어 있습니다. 데이터 업데이트를 위해 '데이터 새로고침' 버튼을 사용하세요.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default PurchaseRequestDashboard;