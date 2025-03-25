import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const RecentActivitiesList = ({ activities }) => {
  // 활동 타입별 색상 매핑
  const activityTypeColors = {
    'PURCHASE_REQUEST_SUBMIT': '#2196f3',
    'PURCHASE_REQUEST_APPROVAL': '#4caf50',
    'BUDGET_USAGE': '#ff9800',
    'ITEM_RECEIPT': '#9c27b0',
    'SYSTEM_UPDATE': '#795548'
  };

  // 활동 타입별 표시 이름 매핑
  const activityTypeDisplayName = {
    'PURCHASE_REQUEST_SUBMIT': '구매요청 제출',
    'PURCHASE_REQUEST_APPROVAL': '구매요청 승인',
    'BUDGET_USAGE': '예산 사용',
    'ITEM_RECEIPT': '물품 수령',
    'SYSTEM_UPDATE': '시스템 업데이트'
  };

  if (!activities || activities.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
        최근 활동이 없습니다.
      </Typography>
    );
  }

  return (
    <List dense sx={{ maxHeight: 350, overflow: 'auto' }}>
      {activities.map((activity) => (
        <ListItem
          key={activity.id}
          divider
          sx={{
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.04)'
            }
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={activityTypeDisplayName[activity.type] || activity.type}
                  size="small"
                  sx={{
                    bgcolor: activityTypeColors[activity.type] || '#666',
                    color: 'white',
                    fontSize: '0.7rem'
                  }}
                />
                <Typography variant="body2" fontWeight="bold">
                  {activity.title}
                </Typography>
              </Box>
            }
            secondary={
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {activity.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activity.timestamp && format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm', { locale: ko })}
                </Typography>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default RecentActivitiesList;