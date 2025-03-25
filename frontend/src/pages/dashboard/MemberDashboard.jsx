import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { fetchMemberDashboardData } from '@redux/memberDashboardSlice';

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
  Dialog,
  DialogTitle,
  DialogContent
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

const statusLabels = {
  TOTAL: '전체',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  REJECTED: '반려'
};

const MemberDashboard = () => {
  const dispatch = useDispatch();
  const { loading, dashboard } = useSelector((state) => state.memberDashboard);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);

  // 초기 데이터 로드
  React.useEffect(() => {
    dispatch(fetchMemberDashboardData());
  }, [dispatch]);

  // 수동 새로고침 핸들러
  const handleRefresh = () => {
    dispatch(fetchMemberDashboardData());
  };

  // 상태별 필터링된 요청 가져오기
const getFilteredRequests = () => {
  if (!dashboard.recentRequests || dashboard.recentRequests.length === 0) return [];
  if (!selectedStatus || selectedStatus === 'TOTAL') {
    return dashboard.recentRequests; // 모든 요청 반환
  }
  return dashboard.recentRequests.filter(
    request => request.status === selectedStatus
  );
};

  // 상태 클릭 핸들러
  const handleStatusClick = (status) => {
    setSelectedStatus(status);
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
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
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
        {/* 구매요청 현황 요약 */}
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
                구매요청 현황
              </Typography>
              <StatusSummary
                stats={dashboard.purchaseRequestStats}
                onStatusClick={handleStatusClick}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 구매요청 */}
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
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#2c3345', mb: 0 }}>
                  {selectedStatus
                    ? `${statusLabels[selectedStatus]} 구매요청`
                    : '최근 구매요청'}
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
              <RecentRequestsList
                requests={getFilteredRequests()}
                searchTerm={searchTerm}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MemberDashboard;