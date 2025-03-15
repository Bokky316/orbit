import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Typography,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';

/**
 * 결재 처리 대화상자 컴포넌트
 * @param {Object} props
 * @param {boolean} props.open - 대화상자 열림 여부
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {string} props.action - 수행할 액션 (APPROVE 또는 REJECT)
 * @param {number} props.lineId - 결재선 ID
 * @param {Function} props.onComplete - 처리 완료 후 콜백 함수
 * @returns {JSX.Element}
 */
function ApprovalProcessDialog({
  open,
  onClose,
  action,
  lineId,
  purchaseRequestId, // 구매 요청 ID 추가 제안
  onComplete
}) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 다이얼로그 제목 및 버튼 텍스트
  const dialogTitle = action === 'APPROVE' ? '결재 승인' : '결재 반려';
  const buttonText = action === 'APPROVE' ? '승인' : '반려';
  const buttonColor = action === 'APPROVE' ? 'success' : 'error';

  // 결재 처리 핸들러
  const handleProcess = async () => {
    try {
      setLoading(true);
      setError(null);

      // 상태 코드 결정 (백엔드 기준에 맞게 수정)
      const nextStatusCode = action === 'APPROVE'
        ? 'APPROVED'  // 상태 코드 수정
        : 'REJECTED';

      // 결재 처리 API 호출
      const response = await fetchWithAuth(`${API_URL}approvals/${lineId}/process`, {
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

      // 처리 완료 콜백 호출 (액션 전달)
      if (onComplete) {
        onComplete(action);
      }

      // 대화상자 닫기
      onClose();
    } catch (err) {
      setError(err.message || '결재 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {dialogTitle}
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <TextField
          autoFocus
          margin="dense"
          label="의견"
          fullWidth
          multiline
          rows={4}
          value={comment}
          onChange={handleCommentChange}
          variant="outlined"
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          취소
        </Button>
        <Button
          onClick={handleProcess}
          variant="contained"
          color={buttonColor}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ApprovalProcessDialog;