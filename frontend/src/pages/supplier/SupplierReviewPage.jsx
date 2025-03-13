import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSupplierById, updateSupplierStatus, resetSupplierState } from '../../redux/supplier/supplierSlice';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Stack,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

// 전화번호 포맷팅 함수 추가
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.includes("-")) {
    return phoneNumber;
  }

  // 전화번호 형식에 따라 하이픈 적용
  if (phoneNumber.length === 8) {
    return phoneNumber.replace(/(\d{4})(\d{4})/, "$1-$2");
  } else if (phoneNumber.length === 9) {
    return phoneNumber.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
  } else if (phoneNumber.length === 10) {
    if (phoneNumber.startsWith("02")) {
      return phoneNumber.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
    } else {
      return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
  } else if (phoneNumber.length === 11) {
    return phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }

  return phoneNumber;
};

// 파일 크기 포맷팅 함수 추가
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const SupplierReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 안전하게 상태 접근
  const supplierState = useSelector((state) => state.supplier) || {
    currentSupplier: null,
    loading: false,
    error: null,
    success: false,
    message: ''
  };
  const { currentSupplier, loading = false, error = null, success = false, message = '' } = supplierState;

  // 안전하게 사용자 정보 접근
  const authState = useSelector((state) => state.auth) || { user: null };
  const { user = null } = authState;

  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [loadingAttachmentId, setLoadingAttachmentId] = useState(null);

  const isAdmin = user && user.role === 'ADMIN';

  useEffect(() => {
    try {
      dispatch(fetchSupplierById(id));
    } catch (err) {
      console.error('Error fetching supplier details:', err);
    }

    return () => {
      try {
        dispatch(resetSupplierState());
      } catch (err) {
        console.error('Error resetting supplier state:', err);
      }
    };
  }, [dispatch, id]);

  // 승인 처리
  const handleApprove = () => {
    try {
      dispatch(updateSupplierStatus({
        id: currentSupplier.id,
        statusCode: 'APPROVED'
      }));
    } catch (err) {
      console.error('Error approving supplier:', err);
    }
  };

  // 반려 모달 열기
  const handleOpenRejectModal = () => {
    setOpenRejectModal(true);
  };

  // 반려 모달 닫기
  const handleCloseRejectModal = () => {
    setOpenRejectModal(false);
    setRejectionReason('');
    setRejectionError('');
  };

  // 반려 사유 입력 처리
  const handleRejectionReasonChange = (e) => {
    setRejectionReason(e.target.value);
    if (rejectionError) setRejectionError('');
  };

  // 반려 처리
  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setRejectionError('반려 사유를 입력해주세요.');
      return;
    }

    try {
      dispatch(updateSupplierStatus({
        id: currentSupplier.id,
        statusCode: 'REJECTED',
        rejectionReason
      }));

      setOpenRejectModal(false);
    } catch (err) {
      console.error('Error rejecting supplier:', err);
      setRejectionError('처리 중 오류가 발생했습니다.');
    }
  };

  // 파일 다운로드 처리 - PurchaseRequestDetailPage 방식 채택
  const downloadFile = async (attachment) => {
    try {
      console.log("[DEBUG] 첨부파일 객체 전체:", attachment); // 디버깅 출력

      // ID 유효성 검사 강화
      if (!attachment?.id || typeof attachment.id !== "number") {
        alert("유효하지 않은 첨부파일 ID입니다.");
        return;
      }

      setLoadingAttachmentId(attachment.id);
      setDownloadError('');

      const response = await fetchWithAuth(
        `${API_URL}supplier-registrations/attachments/${attachment.id}/download`,
        { method: 'GET', responseType: 'blob' }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.fileName; // 원본 파일 이름 사용
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('다운로드 실패:', await response.text());
        setDownloadError('파일 다운로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('다운로드 오류:', error);
      setDownloadError('파일 다운로드 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoadingAttachmentId(null);
    }
  };

  // 상태에 따른 Chip 색상 설정
  const getStatusChip = (status) => {
    // status가 객체인 경우 childCode를 사용
    const statusCode = status?.childCode || status;

    switch(statusCode) {
      case 'APPROVED':
        return <Chip label="승인" color="success" variant="outlined" />;
      case 'PENDING':
        return <Chip label="심사대기" color="warning" variant="outlined" />;
      case 'REJECTED':
        return <Chip label="거절됨" color="error" variant="outlined" />;
      case 'SUSPENDED':
        return <Chip label="일시정지" color="default" variant="outlined" />;
      case 'BLACKLIST':
        return <Chip label="블랙리스트" color="error" variant="outlined" />;
      default:
        return <Chip label="미확인" variant="outlined" />;
    }
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // 데이터가 없을 때
  if (!currentSupplier) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>협력업체 정보</Typography>
          <Alert severity="info">협력업체 정보를 불러오는 중이거나 찾을 수 없습니다.</Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/supplier')}
            sx={{ mt: 2 }}
          >
            목록으로 돌아가기
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>데이터를 처리하는 중 오류가 발생했습니다.</Alert>}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/supplier')}
        >
          목록으로
        </Button>
        <Typography variant="h5">협력업체 상세 정보</Typography>
        <Box sx={{ width: '100px' }}></Box> {/* 균형을 맞추기 위한 빈 박스 */}
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{currentSupplier.supplierName || '이름 없음'}</Typography>
          {getStatusChip(currentSupplier.status)}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* 기본 정보 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>기본 정보</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">사업자등록번호</Typography>
              <Typography variant="body1">{currentSupplier.businessNo || '-'}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">대표자명</Typography>
              <Typography variant="body1">{currentSupplier.ceoName || '-'}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">업태</Typography>
              <Typography variant="body1">{currentSupplier.businessType || '-'}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">업종</Typography>
              <Typography variant="body1">{currentSupplier.businessCategory || '-'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">소싱대분류</Typography>
              <Typography variant="body1">{currentSupplier.sourcingCategory || '-'}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">소싱중분류</Typography>
              <Typography variant="body1">{currentSupplier.sourcingSubCategory || '-'}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">소싱소분류</Typography>
              <Typography variant="body1">{currentSupplier.sourcingDetailCategory || '-'}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">등록 요청일</Typography>
              <Typography variant="body1">{currentSupplier.registrationDate || '-'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* 연락처 정보 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>연락처 정보</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">회사 전화번호</Typography>
              <Typography variant="body1">{formatPhoneNumber(currentSupplier.phoneNumber) || '-'}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">본사 주소</Typography>
              <Typography variant="body1">{currentSupplier.headOfficeAddress || '-'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">담당자</Typography>
              <Typography variant="body1">{currentSupplier.contactPerson || '-'}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">담당자 연락처</Typography>
              <Typography variant="body1">{formatPhoneNumber(currentSupplier.contactPhone) || '-'}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">담당자 이메일</Typography>
              <Typography variant="body1">{currentSupplier.contactEmail || '-'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">비고</Typography>
              <Typography variant="body1">{currentSupplier.comments || '-'}</Typography>
            </Box>
          </Grid>

          {currentSupplier.status?.childCode === 'REJECTED' && currentSupplier.rejectionReason && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">반려 사유</Typography>
                <Typography variant="body2">{currentSupplier.rejectionReason || '반려 사유가 입력되지 않았습니다.'}</Typography>
              </Alert>
            </Grid>
          )}

          {/* 첨부 파일 섹션 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>첨부 파일</Typography>

            {downloadError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {downloadError}
              </Alert>
            )}

            {currentSupplier.attachments && currentSupplier.attachments.length > 0 ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <List>
                  {currentSupplier.attachments.map((attachment) => (
                    <ListItem
                      key={attachment.id}
                      secondaryAction={
                        <Tooltip title="파일 다운로드">
                          <span>
                            <IconButton
                              edge="end"
                              onClick={() => downloadFile(attachment)}
                              disabled={loadingAttachmentId === attachment.id}
                            >
                              {loadingAttachmentId === attachment.id ? <CircularProgress size={24} /> : <DownloadIcon />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      }
                    >
                      <ListItemIcon>
                        <AttachFileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={attachment.fileName}
                        secondary={attachment.fileSize ? formatFileSize(attachment.fileSize) : ''}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ) : (
              currentSupplier.businessFile ? (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <ListItem>
                    <ListItemIcon>
                      <AttachFileIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="사업자등록증"
                      secondary="이전 버전 첨부파일"
                    />
                    <Tooltip title="파일 다운로드">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            // 이전 버전 호환성 - 링크로 열기
                            window.open(`/files/${currentSupplier.businessFile}`, '_blank');
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </ListItem>
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  첨부된 파일이 없습니다.
                </Typography>
              )
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* ADMIN만 보이는 승인/반려 버튼 */}
      {isAdmin && currentSupplier.status?.childCode === 'PENDING' && (
        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={handleOpenRejectModal}
          >
            반려
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={handleApprove}
          >
            승인
          </Button>
        </Paper>
      )}

      {/* 하단 네비게이션 버튼 */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/supplier')}
        >
          목록으로 돌아가기
        </Button>
      </Box>

      {/* 반려 사유 입력 모달 */}
      <Dialog open={openRejectModal} onClose={handleCloseRejectModal}>
        <DialogTitle>반려 사유 입력</DialogTitle>
        <DialogContent>
          <DialogContentText>
            협력업체 등록 요청을 반려하는 사유를 입력해주세요.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="rejection-reason"
            label="반려 사유"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={handleRejectionReasonChange}
            error={!!rejectionError}
            helperText={rejectionError}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectModal} color="inherit">
            취소
          </Button>
          <Button onClick={handleReject} color="error" variant="contained">
            반려하기
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupplierReviewPage;