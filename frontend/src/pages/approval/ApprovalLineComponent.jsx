import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Stepper, Step, StepLabel, StepContent, Divider,
         Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
         TextField, Button, CircularProgress, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';

// 상태에 따른 스타일 지정 - 대기중 상태 회색으로 수정
const StatusChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = () => {
    switch(status) {
      case 'APPROVED': return theme.palette.success.main;
      case 'REJECTED': return theme.palette.error.main;
      case 'IN_REVIEW': return theme.palette.warning.main;
      case 'PENDING': return theme.palette.grey[500]; // 대기중 상태 회색으로 변경
      case 'REQUESTED': return theme.palette.primary.main;
      case 'WAITING': return theme.palette.grey[500]; // 대기중 상태 회색으로 변경
      default: return theme.palette.grey[500];
    }
  };

  return {
    backgroundColor: getStatusColor(),
    color: theme.palette.getContrastText(getStatusColor()),
    fontWeight: 'bold'
  };
});

/**
 * 구매요청 결재선 표시 컴포넌트
 * @param {Object} props
 * @param {number} props.purchaseRequestId - 구매요청 ID
 * @param {string} props.currentUserId - 현재 로그인한 사용자 ID
 * @param {Function} props.onApprovalComplete - 결재 완료 후 콜백 함수
 * @returns {JSX.Element}
 */
function ApprovalLineComponent({ purchaseRequestId, currentUserId, onApprovalComplete }) {
  const [approvalLines, setApprovalLines] = useState([]);
  const [currentUserApprovalLine, setCurrentUserApprovalLine] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0); // 현재 활성화된 단계

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
          const userApprovalLine = data.find(line =>
            line.statusCode === 'IN_REVIEW' &&
            line.approverId === currentUserId
          );
          setCurrentUserApprovalLine(userApprovalLine);

          // 활성 단계 설정 (첫 번째 IN_REVIEW 상태나 가장 앞선 PENDING 상태)
          const inReviewIndex = data.findIndex(line => line.statusCode === 'IN_REVIEW');
          if (inReviewIndex !== -1) {
            setActiveStep(inReviewIndex);
          } else {
            const pendingIndex = data.findIndex(line => line.statusCode === 'PENDING');
            if (pendingIndex !== -1) {
              setActiveStep(pendingIndex);
            }
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
      const nextStatusCode = action === 'APPROVE'
        ? 'APPROVAL-STATUS-APPROVED'
        : 'APPROVAL-STATUS-REJECTED';

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

      // 현재 사용자의 결재 항목 초기화 (이미 처리됨)
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

  // 상태 코드에 따른 한글 상태명 반환
  const getStatusName = (statusCode) => {
    switch(statusCode) {
      case 'APPROVED': return '승인완료';
      case 'REJECTED': return '반려';
      case 'IN_REVIEW': return '검토중';
      case 'PENDING': return '대기중';
      default: return statusCode;
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

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>결재선 정보</Typography>

      {approvalLines.length === 0 ? (
        <Typography color="textSecondary">등록된 결재선이 없습니다.</Typography>
      ) : (
        <>
          {/* 스텝퍼로 결재 진행 상태 표시 */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep} orientation="horizontal">
              {approvalLines.map((line, index) => (
                <Step key={line.id} completed={line.statusCode === 'APPROVED'}>
                  <StepLabel
                    error={line.statusCode === 'REJECTED'}
                    optional={
                      <Typography variant="caption">
                        {line.approverName} ({line.department})
                      </Typography>
                    }
                  >
                    {`${index + 1}단계`}
                  </StepLabel>
                </Step>
              ))}
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
                {approvalLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.step}</TableCell>
                    <TableCell>{line.approverName}</TableCell>
                    <TableCell>{line.department}</TableCell>
                    <TableCell>
                      <StatusChip
                        label={getStatusName(line.statusCode)}
                        status={line.statusCode}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(line.approvedAt)}</TableCell>
                    <TableCell>{line.comment || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 현재 사용자의 결재 처리 폼 */}
          {currentUserApprovalLine && (
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
        </>
      )}
    </Paper>
  );
}

export default ApprovalLineComponent;