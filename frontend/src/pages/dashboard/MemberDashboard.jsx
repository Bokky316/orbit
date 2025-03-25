import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { fetchMemberDashboardData } from '@redux/memberDashboardSlice';
import { filterRequestsByStatus, statusLabels } from '@utils/requestUtils';

// Material-UI 컴포넌트
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Divider,
  Tabs,
  Tab
} from '@mui/material';

// 아이콘
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// 커스텀 컴포넌트
import StatusSummary from '@components/dashboard/StatusSummary';
import RecentActivitiesList from '@components/dashboard/RecentActivitiesList';
import NotificationsList from '@components/dashboard/NotificationsList';
import RecentRequestsList from '@components/dashboard/RecentRequestsList';

// 진행 중 세부 상태 정의
const inProgressSubStatuses = [
  { code: 'ALL', label: '전체' },
  { code: 'REQUESTED', label: '요청됨' },
  { code: 'RECEIVED', label: '접수됨' },
  { code: 'VENDOR_SELECTION', label: '업체선정' },
  { code: 'CONTRACT_PENDING', label: '계약대기' },
  { code: 'INSPECTION', label: '검수' },
  { code: 'INVOICE_ISSUED', label: '인보이스발행' },
  { code: 'PENDING', label: '대기중' },
  { code: 'PENDING_APPROVAL', label: '승인대기' }
];

const MemberDashboard = () => {
  const dispatch = useDispatch();
  const { loading, dashboard, error } = useSelector((state) => state.memberDashboard);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [subStatusTab, setSubStatusTab] = useState('ALL');
  const [showSubStatusTabs, setShowSubStatusTabs] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    dispatch(fetchMemberDashboardData());
  }, [dispatch]);

  // 상태 변경 시 서브 상태 탭 표시 여부 결정
  useEffect(() => {
    // 진행 중 상태일 때만 서브 상태 탭 표시
    setShowSubStatusTabs(selectedStatus === 'IN_PROGRESS');

    // 상태가 변경되면 서브 상태를 '전체'로 초기화
    setSubStatusTab('ALL');
  }, [selectedStatus]);

  // 수동 새로고침 핸들러
  const handleRefresh = () => {
    dispatch(fetchMemberDashboardData());
  };

  // 검색어 입력 핸들러
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 검색어 초기화 핸들러
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // 서브 상태 탭 변경 핸들러
  const handleSubStatusChange = (event, newValue) => {
    setSubStatusTab(newValue);
  };

  // 상태별 필터링된 요청 가져오기
  const getFilteredRequests = () => {
    if (!dashboard.recentRequests || dashboard.recentRequests.length === 0) {
      return [];
    }

    // 1. 메인 상태별 필터링 (TOTAL, IN_PROGRESS, COMPLETED, REJECTED)
    const statusFiltered = filterRequestsByStatus(dashboard.recentRequests, selectedStatus || 'TOTAL');

    // 2. 진행 중 상태의 경우 서브 상태로 추가 필터링
    let subStatusFiltered = statusFiltered;
    if (selectedStatus === 'IN_PROGRESS' && subStatusTab !== 'ALL') {
      subStatusFiltered = statusFiltered.filter(req => req.status === subStatusTab);
    }

    // 3. 검색어로 추가 필터링
    if (!searchTerm) {
      return subStatusFiltered;
    }

    return subStatusFiltered.filter(request =>
      (request.requestName && request.requestName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.requestNumber && request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // 상태 클릭 핸들러
  const handleStatusClick = (status) => {
    setSelectedStatus(status);
  };

  // 리스트 제목 생성
  const getListTitle = () => {
    if (!selectedStatus) {
      return '최근 구매요청';
    }

    if (selectedStatus === 'IN_PROGRESS' && subStatusTab !== 'ALL') {
      const subStatusLabel = inProgressSubStatuses.find(s => s.code === subStatusTab)?.label || '';
      return `${subStatusLabel} 구매요청`;
    }

    return `${statusLabels[selectedStatus]} 구매요청`;
  };

  return (
    <Box sx={{
      p: 3,
      backgroundColor: '#f4f6f8',
      minHeight: '100vh'
    }}>
      {/* 대시보드 헤더 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 3
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c3345' }}>
            {dashboard.memberInfo?.name} 님의 대시보드
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            마지막 업데이트: {format(new Date(), 'PPP', { locale: ko })}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          sx={{
            boxShadow: 'none',
            textTransform: 'none',
            px: 2
          }}
        >
          새로고침
        </Button>
      </Box>

      {/* 검색 필드 */}
      <Box sx={{ pb: 3 }}>
        <TextField
          fullWidth
          placeholder="구매요청 검색..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <Button
                  size="small"
                  onClick={handleClearSearch}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                >
                  <CloseIcon fontSize="small" />
                </Button>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              backgroundColor: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e0e3e7'
              }
            }
          }}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {/* 구매요청 현황 및 목록 (한 카드 안에) */}
        <Grid item xs={12}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              boxShadow: 'none',
              borderColor: '#e0e3e7'
            }}
          >
            <CardContent>
              {/* 구매요청 현황 요약 */}
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#2c3345' }}>
                구매요청 현황
              </Typography>
              <StatusSummary
                stats={dashboard.purchaseRequestStats}
                onStatusClick={handleStatusClick}
              />

              {/* 구분선 */}
              <Divider sx={{ my: 3 }} />

              {/* 최근 구매요청 목록 헤더 */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: showSubStatusTabs ? 0 : 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3345' }}>
                  {getListTitle()}
                </Typography>
                {selectedStatus && (
                  <Button
                    size="small"
                    onClick={() => setSelectedStatus(null)}
                    startIcon={<CloseIcon />}
                  >
                    필터 초기화
                  </Button>
                )}
              </Box>

              {/* 진행 중 상태일 때만 서브 상태 탭 표시 */}
              {showSubStatusTabs && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs
                    value={subStatusTab}
                    onChange={handleSubStatusChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        minWidth: 'auto',
                        px: 2,
                        py: 1,
                        fontSize: '0.875rem'
                      }
                    }}
                  >
                    {inProgressSubStatuses.map((status) => (
                      <Tab
                        key={status.code}
                        value={status.code}
                        label={status.label}
                      />
                    ))}
                  </Tabs>
                </Box>
              )}

              {/* 구매요청 목록 */}
              <RecentRequestsList
                requests={getFilteredRequests()}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 활동 (구매요청 아래에 별도로 배치) */}
        <Grid item xs={12}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              boxShadow: 'none',
              borderColor: '#e0e3e7'
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#2c3345' }}>
                최근 활동
              </Typography>
              <RecentActivitiesList
                activities={dashboard.recentActivities || []}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MemberDashboard;