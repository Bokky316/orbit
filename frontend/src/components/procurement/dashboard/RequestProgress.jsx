// src/components/procurement/dashboard/RequestProgress.jsx
import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Divider,
  Stack
} from '@mui/material';

const RequestProgress = ({ progress }) => {
  if (!progress) {
    return (
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography color="text.secondary">진행 상태 정보가 없습니다.</Typography>
        </CardContent>
      </Card>
    );
  }

  // 상태 코드별 표시 이름 매핑
  const statusDisplayName = {
    'REQUESTED': '요청됨',
    'RECEIVED': '접수됨',
    'VENDOR_SELECTION': '업체선정',
    'CONTRACT_PENDING': '계약대기',
    'INSPECTION': '검수',
    'INVOICE_ISSUED': '인보이스발행',
    'PAYMENT_COMPLETED': '대금지급완료'
  };

  // 상태별 색상 매핑
  const statusColors = {
    'REQUESTED': '#ff9800',
    'RECEIVED': '#2196f3',
    'VENDOR_SELECTION': '#9c27b0',
    'CONTRACT_PENDING': '#f44336',
    'INSPECTION': '#4caf50',
    'INVOICE_ISSUED': '#795548',
    'PAYMENT_COMPLETED': '#3f51b5'
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <CardHeader
        title={
          <Box>
            <Typography variant="h6">{progress.requestName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {progress.requestNumber}
            </Typography>
          </Box>
        }
        action={
          <Chip
            label={statusDisplayName[progress.currentStatus] || progress.currentStatus}
            sx={{
              bgcolor: statusColors[progress.currentStatus],
              color: 'white',
              fontWeight: 'medium'
            }}
          />
        }
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={progress.completionPercentage}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
            {Math.round(progress.completionPercentage)}%
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>현재 단계</Typography>
            <Chip
              label={statusDisplayName[progress.currentStatus] || progress.currentStatus}
              sx={{
                bgcolor: statusColors[progress.currentStatus],
                color: 'white'
              }}
            />
          </Box>
          {progress.nextStep && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>다음 단계</Typography>
              <Chip
                label={statusDisplayName[progress.nextStep] || progress.nextStep}
                variant="outlined"
              />
            </Box>
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>완료된 단계</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {progress.completedSteps.map((step) => (
              <Chip
                key={step}
                label={statusDisplayName[step] || step}
                color="success"
                size="small"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>

        {progress.pendingSteps && progress.pendingSteps.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>남은 단계</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {progress.pendingSteps.map((step) => (
                <Chip
                  key={step}
                  label={statusDisplayName[step] || step}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestProgress;