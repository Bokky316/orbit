import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card
} from '@mui/material';
import { statusColors, statusLabels } from '@utils/requestUtils';

const StatusSummary = ({ stats = {}, onStatusClick }) => {
  const requestStatuses = [
    {
      label: statusLabels.TOTAL,
      count: stats.totalRequests || 0,
      status: 'TOTAL'
    },
    {
      label: statusLabels.IN_PROGRESS,
      count: stats.inProgressRequests || 0,
      status: 'IN_PROGRESS'
    },
    {
      label: statusLabels.COMPLETED,
      count: stats.completedRequests || 0,
      status: 'COMPLETED'
    },
    {
      label: statusLabels.REJECTED,
      count: stats.rejectedRequests || 0,
      status: 'REJECTED'
    }
  ];

  return (
    <Grid container spacing={2}>
      {requestStatuses.map((status) => {
        const colors = statusColors[status.status];
        return (
          <Grid item xs={3} key={status.label}>
            <Card
              onClick={() => onStatusClick(status.status)}
              sx={{
                textAlign: 'center',
                p: 2,
                backgroundColor: colors.light,
                boxShadow: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: colors.dark,
                  fontWeight: 'bold',
                  mb: 1
                }}
              >
                {status.label}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                  color: colors.dark
                }}
              >
                {status.count}
              </Typography>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default StatusSummary;