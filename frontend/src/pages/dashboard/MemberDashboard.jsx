// src/pages/dashboard/MemberDashboard.jsx
import React, { useEffect } from 'react';
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
  InputAdornment
} from '@mui/material';

// 아이콘
import {
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';

// 커스텀 컴포넌트
import StatusSummary from '@components/dashboard/StatusSummary';
import RecentActivitiesList from '@components/dashboard/RecentActivitiesList';
import NotificationsList from '@components/dashboard/NotificationsList';
import PendingApprovalsList from '@components/dashboard/PendingApprovalsList';
import RecentRequestsList from '@components/dashboard/RecentRequestsList';

const MemberDashboard = () => {
  const dispatch = useDispatch();
  const { loading, dashboard } = useSelector((state) => state.memberDashboard);

  const [searchTerm, setSearchTerm] = React.useState('');

  // 초기 데이터 로드
  useEffect(() => {
    dispatch(fetchMemberDashboardData());
  }, [dispatch]);

  // 수동 새로고침 핸들러
  const handleRefresh = () => {
    dispatch(fetchMemberDashboardData());
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 대시보드 헤더 */}
      <Box sx={{ pb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ mr: 2 }}>
            {dashboard.memberInfo?.name} 님의 대시보드
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            새로고침
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          마지막 업데이트: {format(new Date(), 'PPP', { locale: ko })}
        </Typography>
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
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* 구매요청 현황 요약 */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                구매요청 현황
              </Typography>
              <StatusSummary stats={dashboard.purchaseRequestStats} />
            </CardContent>
          </Card>
        </Grid>

        {/* 알림 */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>알림</Typography>
              <NotificationsList notifications={dashboard.notifications} />
            </CardContent>
          </Card>
        </Grid>

        {/* 처리 대기중인 요청 */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                처리 대기중인 요청
              </Typography>
              <PendingApprovalsList requests={dashboard.pendingApprovals} />
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 구매요청 */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>최근 구매요청</Typography>
              <RecentRequestsList
                requests={dashboard.recentRequests}
                searchTerm={searchTerm}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 활동 */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>최근 활동</Typography>
              <RecentActivitiesList activities={dashboard.recentActivities} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MemberDashboard;