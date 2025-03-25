// src/components/procurement/dashboard/FilterPanel.jsx
import React from "react";
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from "@mui/material";
import { Search, Refresh } from "@mui/icons-material";

const FilterPanel = ({
  filters,
  departments,
  statusCodes,
  onFilterChange,
  onFilterSubmit,
  onFilterReset
}) => {
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

  // 사업 구분 표시 매핑
  const businessTypeDisplayName = {
    'SI': '시스템 통합',
    'MAINTENANCE': '유지보수',
    'GOODS': '물품'
  };

  // 날짜 타입의 input 이벤트 핸들러
  const handleDateChange = (e, field) => {
    onFilterChange(field, e.target.value);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 4,
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        bgcolor: '#f8f9fa'
      }}
    >
      <Typography variant="h6" gutterBottom>검색 필터</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>상태</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              label="상태"
            >
              <MenuItem value="">전체</MenuItem>
              {statusCodes.map(code => (
                <MenuItem key={code} value={code}>
                  {statusDisplayName[code] || code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>부서</InputLabel>
            <Select
              value={filters.department}
              onChange={(e) => onFilterChange('department', e.target.value)}
              label="부서"
            >
              <MenuItem value="">전체</MenuItem>
              {departments.map(dept => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>사업 구분</InputLabel>
            <Select
              value={filters.businessType}
              onChange={(e) => onFilterChange('businessType', e.target.value)}
              label="사업 구분"
            >
              <MenuItem value="">전체</MenuItem>
              {Object.entries(businessTypeDisplayName).map(([code, name]) => (
                <MenuItem key={code} value={code}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="프로젝트 ID"
            placeholder="프로젝트 ID"
            value={filters.projectId}
            onChange={(e) => onFilterChange('projectId', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="시작일"
            type="date"
            value={filters.fromDate}
            onChange={(e) => handleDateChange(e, 'fromDate')}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="종료일"
            type="date"
            value={filters.toDate}
            onChange={(e) => handleDateChange(e, 'toDate')}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: filters.fromDate }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={onFilterSubmit}
              startIcon={<Search />}
              fullWidth
            >
              검색
            </Button>
            <Button
              variant="outlined"
              onClick={onFilterReset}
              startIcon={<Refresh />}
              fullWidth
            >
              초기화
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FilterPanel;