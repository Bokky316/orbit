// src/pages/commonCode/CommonCodeManagement.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardHeader,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Fab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  fetchAllCommonCodes,
  selectAllCommonCodes,
  selectCommonCodeLoading,
  selectCommonCodeError
} from '@redux/commonCodeSlice';
import CommonCodeForm from '@pages/commonCode/CommonCodeForm';
import { fetchWithAuth } from '@utils/fetchWithAuth';
import { API_URL } from '@utils/constants';

/**
 * 공통 코드 관리 페이지 컴포넌트
 * 공통 코드 목록을 타입별로 그룹화하여 보여줍니다.
 */
const CommonCodeManagement = () => {
  const dispatch = useDispatch();
  const allCodes = useSelector(selectAllCommonCodes);
  const isLoading = useSelector(selectCommonCodeLoading);
  const error = useSelector(selectCommonCodeError);

  // 다이얼로그 상태 관리
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedCode, setSelectedCode] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // 컴포넌트가 마운트될 때 공통 코드 목록을 가져옴
  useEffect(() => {
    dispatch(fetchAllCommonCodes());
  }, [dispatch]);

  // 새 코드 등록 핸들러
  const handleCreateCode = () => {
    setSelectedCode(null);
    setFormMode('create');
    setFormOpen(true);
  };

  // 코드 수정 핸들러
  const handleEditCode = (code, isParent = true) => {
    setSelectedCode(code);
    setFormMode('edit');
    setFormOpen(true);
  };

  // 부모 코드 삭제 핸들러
  const handleDeleteParentCode = (id, codeName) => {
    setDeleteType('parent');
    setDeleteId(id);
    setSelectedCode({ codeName });
    setDeleteDialogOpen(true);
  };

  // 자식 코드 삭제 핸들러
  const handleDeleteChildCode = (id, codeName) => {
    setDeleteType('child');
    setDeleteId(id);
    setSelectedCode({ codeName });
    setDeleteDialogOpen(true);
  };

  // 삭제 확인 핸들러
  const handleConfirmDelete = async () => {
    try {
      const endpoint = deleteType === 'parent'
        ? `${API_URL}common-codes/parents/${deleteId}`
        : `${API_URL}common-codes/children/${deleteId}`;

      const response = await fetchWithAuth(endpoint, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`삭제 실패: ${response.status} - ${errorText}`);
      }

      // 성공 메시지 설정
      setActionSuccess(`${selectedCode.codeName} 코드가 삭제되었습니다.`);

      // 코드 목록 갱신
      dispatch(fetchAllCommonCodes());

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('코드 삭제 중 오류:', error);
      setActionError(error.message || '코드 삭제 중 오류가 발생했습니다.');

      // 3초 후 오류 메시지 제거
      setTimeout(() => {
        setActionError(null);
      }, 3000);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // 다이얼로그 닫기 핸들러
  const handleCloseForm = () => {
    setFormOpen(false);
    // 폼 닫은 후 코드 목록 갱신
    dispatch(fetchAllCommonCodes());
  };

  // 에러 발생 시 표시할 알림
  if (error) {
    // 객체를 안전하게 문자열로 변환
    const errorMessage = typeof error === 'object' ?
      JSON.stringify(error) : String(error);

    return (
      <Alert severity="error" sx={{ mt: 3 }}>
        오류가 발생했습니다: {errorMessage}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          공통 코드 관리
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateCode}
        >
          새 코드 등록
        </Button>
      </Box>

      {/* 성공 메시지 */}
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {actionSuccess}
        </Alert>
      )}

      {/* 에러 메시지 */}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>공통 코드를 불러오는 중입니다...</Typography>
        </Box>
      )}

      {/* 공통 코드 타입별 목록 */}
      {!isLoading && (!allCodes || allCodes.length === 0) && (
        <Alert severity="info">등록된 공통 코드가 없습니다.</Alert>
      )}

      {Array.isArray(allCodes) && allCodes.map((entityTypeGroup, index) => (
        <Card key={index} sx={{ mb: 4 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6">{entityTypeGroup.entityType}</Typography>
                <Chip
                  label={entityTypeGroup.parentCodes.length}
                  color="primary"
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            }
          />
          <CardContent>
            {Array.isArray(entityTypeGroup.parentCodes) && entityTypeGroup.parentCodes.map((parentCode, pIndex) => (
              <Accordion key={pIndex}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel${pIndex}-content`}
                  id={`panel${pIndex}-header`}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 'bold' }}>{parentCode.codeName}</Typography>
                      <Typography variant="caption" color="text.secondary">({parentCode.codeGroup})</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip label={parentCode.childCodes?.length || 0} color="info" size="small" sx={{ mr: 1 }} />
                      <Box onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="상위 코드 수정">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditCode(parentCode, true)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="상위 코드 삭제">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteParentCode(parentCode.id, parentCode.codeName)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setSelectedCode({ parentCodeId: parentCode.id });
                        setFormMode('create');
                        setFormOpen(true);
                      }}
                    >
                      하위 코드 추가
                    </Button>
                  </Box>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>코드값</TableCell>
                          <TableCell>코드명</TableCell>
                          <TableCell>전체 코드</TableCell>
                          <TableCell align="right">작업</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.isArray(parentCode.childCodes) && parentCode.childCodes.map((childCode, cIndex) => (
                          <TableRow key={cIndex} hover>
                            <TableCell>{childCode.codeValue}</TableCell>
                            <TableCell>{childCode.codeName}</TableCell>
                            <TableCell>
                              <code>
                                {entityTypeGroup.entityType}-{parentCode.codeGroup}-{childCode.codeValue}
                              </code>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="하위 코드 수정">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditCode(childCode, false)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="하위 코드 삭제">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteChildCode(childCode.id, childCode.codeName)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!parentCode.childCodes || parentCode.childCodes.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              자식 코드가 없습니다.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* 플로팅 액션 버튼 - 새 코드 등록 */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 20, right: 20 }}
        onClick={handleCreateCode}
      >
        <AddIcon />
      </Fab>

      {/* 코드 등록/수정 다이얼로그 */}
      <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogContent>
          <CommonCodeForm
            initialData={selectedCode}
            formMode={formMode}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>코드 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`'${selectedCode?.codeName || ''}' ${deleteType === 'parent' ? '상위' : '하위'} 코드를 정말 삭제하시겠습니까?`}
            {deleteType === 'parent' && <strong> 이 작업은 모든 하위 코드도 함께 삭제합니다.</strong>}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            취소
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommonCodeManagement;