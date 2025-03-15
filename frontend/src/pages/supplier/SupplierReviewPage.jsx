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
  AttachFile as AttachFileIcon,
  Block as BlockIcon,
  ErrorOutline as ErrorOutlineIcon,
  Edit as EditIcon // 수정 아이콘 추가
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
  const [openApproveModal, setOpenApproveModal] = useState(false); // 승인 확인 모달 상태 추가
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [loadingAttachmentId, setLoadingAttachmentId] = useState(null);
  const [openInactivateModal, setOpenInactivateModal] = useState(false);
  const [inactivateReason, setInactivateReason] = useState('');
  const [openActivateModal, setOpenActivateModal] = useState(false);

  // ADMIN 권한 체크 수정
  const isAdmin = user && user.roles && user.roles.includes('ROLE_ADMIN');
  // SUPPLIER 권한 체크 추가
  const isSupplier = user && user.roles && user.roles.includes('ROLE_SUPPLIER');

  console.log('현재 협력업체 전체 데이터:', currentSupplier);
  // 현재 사용자가 해당 업체의 소유자인지 확인
  const isOwner = isSupplier && currentSupplier && currentSupplier.status?.childCode === 'PENDING';

  console.log('사용자 ID:', user?.id);
  console.log('isSupplier:', isSupplier);
  console.log('협력업체 상태:', currentSupplier?.status?.childCode);
  console.log('isOwner 수정된 결과:', isOwner);

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

  // 수정 기능 추가 - PENDING 상태의 공급업체를 수정 페이지로 이동
  const handleEdit = () => {
    // 공급업체 ID와 함께 수정 페이지로 이동
    navigate(`/supplier/edit/${currentSupplier.id}`);
  };

  // 승인 모달 열기
  const handleOpenApproveModal = () => {
    setOpenApproveModal(true);
  };

  // 승인 모달 닫기
  const handleCloseApproveModal = () => {
    setOpenApproveModal(false);
  };

  // 승인 처리
  const handleApprove = () => {
    try {
      dispatch(updateSupplierStatus({
        id: currentSupplier.id,
        statusCode: 'APPROVED'
      }));
      setOpenApproveModal(false); // 모달 닫기
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

  // 비활성화 모달 열기 함수 추가
  const handleOpenInactivateModal = () => {
    setOpenInactivateModal(true);
  };

  // 비활성화 모달 닫기 함수 추가
  const handleCloseInactivateModal = () => {
    setOpenInactivateModal(false);
    setInactivateReason('');
  };

  // 활성화 모달 열기 함수 추가
  const handleOpenActivateModal = () => {
    setOpenActivateModal(true);
  };

  // 활성화 모달 닫기 함수 추가
  const handleCloseActivateModal = () => {
    setOpenActivateModal(false);
  };

  // 비활성화 처리 함수 추가
  const handleInactivateSupplier = () => {
    if (currentSupplier?.id) {
      try {
        dispatch(updateSupplierStatus({
          id: currentSupplier.id,
          statusCode: 'INACTIVE',
          rejectionReason: inactivateReason
        }))
          .unwrap()
          .then(() => {
            handleCloseInactivateModal();
            // 상태 변경 후 목록 페이지로 리다이렉트
            navigate('/supplier');
          })
          .catch(error => {
            console.error('비활성화 오류:', error);
          });
      } catch (err) {
        console.error('비활성화 오류:', err);
      }
    }
  };

  // 활성화 처리 함수 추가
  const handleActivateSupplier = () => {
    if (currentSupplier?.id) {
      try {
        dispatch(updateSupplierStatus({
          id: currentSupplier.id,
          statusCode: 'ACTIVE'
        }))
          .unwrap()
          .then(() => {
            handleCloseActivateModal();
            // 상태 변경 후 목록 페이지로 리다이렉트
            navigate('/supplier');
          })
          .catch(error => {
            console.error('활성화 오류:', error);
          });
      } catch (err) {
        console.error('활성화 오류:', err);
      }
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
        return <Chip label="반려" color="error" variant="outlined" />;
      case 'SUSPENDED':
        return <Chip label="일시정지" color="default" variant="outlined" />;
      case 'BLACKLIST':
        return <Chip label="블랙리스트" color="error" variant="outlined" />;
      case 'INACTIVE':
        return <Chip label="비활성" color="default" variant="outlined" />;
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getStatusChip(currentSupplier.status)}

            {/* SUPPLIER 본인이고 상태가 PENDING일 때 수정 버튼 표시 */}
            {isSupplier && currentSupplier && currentSupplier.status?.childCode === 'PENDING' && (
              <Button
                size="small"
                color="primary"
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                수정하기
              </Button>
            )}

            {/* ADMIN에게만 활성화/비활성화 버튼 표시 */}
            {isAdmin && currentSupplier.status?.childCode !== 'PENDING' && (
              <>
                {currentSupplier.status === 'INACTIVE' || currentSupplier.status?.childCode === 'INACTIVE' ? (
                  <Button
                    size="small"
                    color="success"
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleOpenActivateModal}
                  >
                    활성화 하기
                  </Button>
                ) : (
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    startIcon={<BlockIcon />}
                    onClick={handleOpenInactivateModal}
                  >
                    비활성화 하기
                  </Button>
                )}
              </>
            )}
          </Box>
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
              <Typography variant="body1">
                {currentSupplier.postalCode ? `[${currentSupplier.postalCode}] ` : ''}
                {currentSupplier.roadAddress || ''}
                {currentSupplier.detailAddress ? ` ${currentSupplier.detailAddress}` : ''}
              </Typography>
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
            onClick={handleOpenApproveModal} // 모달 열기로 변경
          >
            승인
          </Button>
        </Paper>
      )}

      {/* SUPPLIER 본인이고 PENDING 상태일 때 수정 버튼 (하단) */}
      {isSupplier && isOwner && currentSupplier.status?.childCode === 'PENDING' && (
        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            정보 수정하기
          </Button>
        </Paper>
      )}

      {/* SUPPLIER 본인이고 REJECTED 상태일 때 재승인 요청 버튼 */}
      {isSupplier && currentSupplier && currentSupplier.status?.childCode === 'REJECTED' && (
        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            정보 수정 및 재승인 요청하기
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

      {/* 승인 확인 모달 */}
      <Dialog open={openApproveModal} onClose={handleCloseApproveModal}>
        <DialogTitle>협력업체 승인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            '{currentSupplier?.supplierName || "해당 업체"}' 협력업체의 등록 요청을 승인하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApproveModal} color="inherit">
            취소
          </Button>
          <Button onClick={handleApprove} color="success" variant="contained">
            승인하기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 비활성화 확인 모달 */}
      <Dialog
        open={openInactivateModal}
        onClose={handleCloseInactivateModal}
        aria-labelledby="inactivate-dialog-title"
      >
        <DialogTitle id="inactivate-dialog-title">협력업체 비활성화</DialogTitle>
        <DialogContent>
          <DialogContentText>
            '{currentSupplier?.supplierName || "해당 업체"}' 협력업체를 비활성화하시겠습니까?
            비활성화 후에는 해당 업체와 더 이상 거래가 불가능합니다.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="inactivate-reason"
            label="비활성화 사유"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={inactivateReason}
            onChange={(e) => setInactivateReason(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInactivateModal} color="inherit">
            취소
          </Button>
          <Button onClick={handleInactivateSupplier} color="error" variant="contained">
            비활성화
          </Button>
        </DialogActions>
      </Dialog>

      {/* 활성화 확인 모달 */}
      <Dialog
        open={openActivateModal}
        onClose={handleCloseActivateModal}
        aria-labelledby="activate-dialog-title"
      >
        <DialogTitle id="activate-dialog-title">협력업체 활성화</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ErrorOutlineIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                '{currentSupplier?.supplierName || "해당 업체"}' 협력업체를 다시 활성화하시겠습니까?
              </Typography>
            </Box>
            <Typography>
              활성화하면 해당 업체와 다시 거래가 가능해집니다. 비활성 사유는 삭제되며,
              업체 상태는 '승인'으로 변경됩니다.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActivateModal} color="inherit">
            취소
          </Button>
          <Button onClick={handleActivateSupplier} color="success" variant="contained">
            활성화
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupplierReviewPage;