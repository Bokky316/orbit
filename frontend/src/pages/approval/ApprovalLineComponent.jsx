import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Stepper, Step, StepLabel, Divider,
         Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
         TextField, Button, CircularProgress, Chip } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';

// 상태에 따른 스타일 지정
const StatusChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = () => {
    switch(status) {
      case 'APPROVED': return theme.palette.success.main;
      case 'REJECTED': return theme.palette.error.main;
      case 'IN_REVIEW': return theme.palette.warning.main;
      case 'PENDING': return theme.palette.grey[500];
      case 'WAITING': return theme.palette.grey[500];
      case 'REQUESTED': return theme.palette.primary.main;
      default: return theme.palette.grey[500];
    }
  };

  return {
    backgroundColor: getStatusColor(),
    color: theme.palette.getContrastText(getStatusColor()),
    fontWeight: 'bold'
  };
});

// totalSteps 파라미터 제거 - 실제 결재 데이터 기반으로 단계 결정
function ApprovalLineComponent({ purchaseRequestId, onApprovalComplete }) {
  const theme = useTheme();
  const { user } = useSelector(state => state.auth);
  const currentUserId = user?.id;

  const [approvalLines, setApprovalLines] = useState([]);
  const [currentUserApprovalLine, setCurrentUserApprovalLine] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  // 상태별 색상 및 라벨 결정 함수 - 대기중 상태 회색으로 수정
  const getStepInfo = (statusCode) => {
    switch(statusCode) {
      case 'APPROVED': return {
        color: theme.palette.success.main,
        label: '승인'
      };
      case 'REJECTED': return {
        color: theme.palette.error.main,
        label: '반려'
      };
      case 'IN_REVIEW': return {
        color: theme.palette.warning.main,
        label: '검토중'
      };
      case 'PENDING': return {
        color: theme.palette.grey[500],
        label: '보류'
      };
      case 'WAITING': return {
        color: theme.palette.grey[500],
        label: '대기중'
      };
      case 'REQUESTED': return {
        color: theme.palette.primary.main,
        label: '요청됨'
      };
      default: return {
        color: theme.palette.grey[500],
        label: '대기중'
      };
    }
  };

  // 결재선 정보 조회
  useEffect(() => {
    if (!purchaseRequestId) return;

    const fetchApprovalLines = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAuth(`${API_URL}approvals/${purchaseRequestId}`);

        if (!response.ok) {
          throw new Error(`결재선 조회 실패: ${response.status}`);
        }

        const data = await response.json();
        setApprovalLines(data);

        // 현재 진행 중인 결재 단계 찾기
        const currentStepIndex = data.findIndex(line =>
          line.statusCode === 'IN_REVIEW' || line.statusCode === 'PENDING'
        );

        // 현재 사용자의 결재 항목 찾기 (모든 상태 포함)
        if (currentUserId) {
          // 기존 로직 대신 새로운 로직 추가
          const userApprovalLine = data.find(line =>
            String(line.approverId) === String(currentUserId)
          );

          console.log('찾은 사용자 결재 라인:', userApprovalLine);

          setCurrentUserApprovalLine(userApprovalLine);

          // 활성 단계 설정
          if (currentStepIndex !== -1) {
            setActiveStep(currentStepIndex);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('결재선 조회 중 오류 발생:', err);
        setError('결재선 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchApprovalLines();
  }, [purchaseRequestId, currentUserId, user]);

  // 결재 처리 함수
  const handleProcessApproval = async (action) => {
    if (!currentUserApprovalLine) {
      setError('결재 권한이 없습니다.');
      return;
    }

    try {
      setLoading(true);

      // 상태 코드 결정 (승인 또는 반려)
      const nextStatusCode = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

      const response = await fetchWithAuth(`${API_URL}approvals/${currentUserApprovalLine.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          comment: comment,
          nextStatusCode: nextStatusCode
        })
      });

      if (!response.ok) {
        throw new Error(`결재 처리 실패: ${response.status}`);
      }

      // 결재선 정보 다시 조회
      const updatedResponse = await fetchWithAuth(`${API_URL}approvals/${purchaseRequestId}`);
      const updatedData = await updatedResponse.json();
      setApprovalLines(updatedData);

      // 현재 사용자의 결재 항목 초기화
      setCurrentUserApprovalLine(null);
      setComment('');

      // 콜백 함수 호출
      if (onApprovalComplete) {
        onApprovalComplete(action);
      }

      setLoading(false);
    } catch (err) {
      console.error('결재 처리 중 오류 발생:', err);
      setError('결재 처리 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 날짜 형식 변환
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && approvalLines.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return (
      <Box sx={{ my: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // 동적으로 결재 단계 결정
  // approvalLines 배열에 있는 실제 결재 단계만 표시
  const sortedApprovalLines = [...approvalLines].sort((a, b) => a.step - b.step);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>결재선 정보</Typography>

      {/* 동적 단계를 보여주는 스텝퍼 */}
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={-1} orientation="horizontal">
          {sortedApprovalLines.map((line) => {
            const stepInfo = getStepInfo(line.statusCode);
            return (
              <Step
                key={line.id}
                completed={line.statusCode === 'APPROVED'}
                sx={{
                  '& .MuiStepIcon-root': {
                    color: stepInfo.color
                  }
                }}
              >
                <StepLabel
                  error={line.statusCode === 'REJECTED'}
                  optional={
                    <Typography variant="caption">
                      {line.approverName ? `${line.approverName} (${line.department})` : '미지정'}
                    </Typography>
                  }
                >
                  {`${line.step}단계`}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 결재선 상세 정보 테이블 */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>순서</TableCell>
              <TableCell>결재자</TableCell>
              <TableCell>부서</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>결재일시</TableCell>
              <TableCell>의견</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedApprovalLines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{line.step}</TableCell>
                <TableCell>{line.approverName || '-'}</TableCell>
                <TableCell>{line.department || '-'}</TableCell>
                <TableCell>
                  <StatusChip
                    label={getStepInfo(line.statusCode).label}
                    status={line.statusCode}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {line.approvedAt
                    ? formatDateTime(line.approvedAt)
                    : (line.rejectedAt
                      ? formatDateTime(line.rejectedAt)
                      : '-')
                  }
                </TableCell>
                <TableCell>{line.comment || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 현재 사용자의 결재 처리 폼 */}
      {currentUserApprovalLine && currentUserApprovalLine.statusCode !== 'APPROVED' && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" gutterBottom>결재 처리</Typography>
          <TextField
            fullWidth
            label="의견"
            multiline
            rows={3}
            variant="outlined"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleProcessApproval('APPROVE')}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : '승인'}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleProcessApproval('REJECT')}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : '반려'}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default ApprovalLineComponent;