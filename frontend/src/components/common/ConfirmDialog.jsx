// src/components/common/ConfirmDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';

/**
 * 공통 확인 다이얼로그 컴포넌트
 * @param {Object} props
 * @param {boolean} props.open 다이얼로그 열림 상태
 * @param {string} props.title 다이얼로그 제목
 * @param {string} props.content 다이얼로그 내용
 * @param {Function} props.onConfirm 확인 버튼 클릭 시 실행될 함수
 * @param {Function} props.onClose 닫기/취소 버튼 클릭 시 실행될 함수
 */
const ConfirmDialog = ({
  open,
  title,
  content,
  onConfirm,
  onClose
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          취소
        </Button>
        <Button onClick={onConfirm} color="secondary" autoFocus>
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;