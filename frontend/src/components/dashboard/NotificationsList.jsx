import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip
} from '@mui/material';

const NotificationsList = ({ notifications }) => {
  // 알림 타입별 색상 매핑
  const notificationTypeColors = {
    'PURCHASE_REQUEST': '#2196f3',
    'APPROVAL': '#4caf50',
    'BUDGET': '#ff9800',
    'SYSTEM': '#9c27b0',
    'CATALOG_UPDATE': '#795548'
  };

  if (notifications.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
        새로운 알림이 없습니다.
      </Typography>
    );
  }

  return (
    <List dense>
      {notifications.slice(0, 5).map((noti) => (
        <ListItem
          key={noti.id}
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
                  label={noti.type}
                  size="small"
                  sx={{
                    bgcolor: notificationTypeColors[noti.type] || '#666',
                    color: 'white',
                    fontSize: '0.7rem'
                  }}
                />
                <Typography variant="body2" fontWeight={noti.isRead ? 'normal' : 'bold'}>
                  {noti.title}
                </Typography>
              </Box>
            }
            secondary={
              <Typography variant="caption" color="text.secondary">
                {new Date(noti.timestamp).toLocaleString()}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default NotificationsList;