import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip
} from '@mui/material';

const RecentActivitiesList = ({ activities }) => {
  // 활동 타입별 색상 매핑
  const activityTypeColors = {
    'PURCHASE_REQUEST_SUBMIT': '#2196f3',
    'PURCHASE_REQUEST_APPROVAL': '#4caf50',
    'BUDGET_USAGE': '#ff9800',
    'ITEM_RECEIPT': '#9c27b0',
    'SYSTEM_UPDATE': '#795548'
  };

  if (activities.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
        최근 활동이 없습니다.
      </Typography>
    );
  }

  return (
    <List dense>
      {activities.slice(0, 5).map((activity) => (
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
                  label={activity.type}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  {activity.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(activity.timestamp).toLocaleString()}
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