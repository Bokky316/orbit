import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, CircularProgress, Divider,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, Tooltip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';

/**
 * 결재선 설정 컴포넌트
 * @param {Object} props
 * @param {number} props.purchaseRequestId - 구매요청 ID
 * @param {Function} props.onSetupComplete - 설정 완료 후 콜백 함수
 * @returns {JSX.Element}
 */
function ApprovalLineSetupComponent({ purchaseRequestId, onSetupComplete }) {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 사용자 목록 조회
  // 사용자 목록 조회
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        // 엔드포인트를 결재자 전용 엔드포인트로 변경
        const response = await fetchWithAuth(`${API_URL}approvals/eligible-members`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Detailed error:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          throw new Error(`사용자 목록 조회 실패: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        setMembers(data);
        setFilteredMembers(data);
      } catch (err) {
        console.error('사용자 목록 조회 중 오류:', err);
        setError(err.message || '사용자 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // 검색어 변경 핸들러
  const handleSearchChange = (event) => {
    const keyword = event.target.value;
    setSearchKeyword(keyword);

    if (keyword.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member =>
        member.name.includes(keyword) ||
        member.department?.name.includes(keyword) ||
        member.position?.name.includes(keyword)
      );
      setFilteredMembers(filtered);
    }
  };

  // 결재자 추가 핸들러
  const handleAddApprover = (member) => {
    // 이미 선택된 결재자인지 확인
    if (selectedApprovers.some(approver => approver.id === member.id)) {
      return;
    }

    setSelectedApprovers([...selectedApprovers, member]);
    setOpenDialog(false);
    setSearchKeyword('');
    setFilteredMembers(members);
  };

  // 결재자 제거 핸들러
  const handleRemoveApprover = (index) => {
    const newApprovers = [...selectedApprovers];
    newApprovers.splice(index, 1);
    setSelectedApprovers(newApprovers);
  };

  // 결재자 순서 변경 핸들러 (위로)
  const handleMoveUp = (index) => {
    if (index === 0) return;

    const newApprovers = [...selectedApprovers];
    [newApprovers[index - 1], newApprovers[index]] = [newApprovers[index], newApprovers[index - 1]];
    setSelectedApprovers(newApprovers);
  };

  // 결재자 순서 변경 핸들러 (아래로)
  const handleMoveDown = (index) => {
    if (index === selectedApprovers.length - 1) return;

    const newApprovers = [...selectedApprovers];
    [newApprovers[index], newApprovers[index + 1]] = [newApprovers[index + 1], newApprovers[index]];
    setSelectedApprovers(newApprovers);
  };

  // 결재선 저장 핸들러
  const handleSaveApprovalLine = async () => {
    if (selectedApprovers.length === 0) {
      setError('결재자를 한 명 이상 선택해주세요.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetchWithAuth(`${API_URL}approvals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          purchaseRequestId: purchaseRequestId,
          approverIds: selectedApprovers.map(approver => approver.id),
          initialStatusCode: 'APPROVAL-STATUS-PENDING'
        })
      });

      if (!response.ok) {
        throw new Error(`결재선 저장 실패: ${response.status}`);
      }

      // 결재선 설정 완료 콜백 호출
      if (onSetupComplete) {
        onSetupComplete();
      }

      setLoading(false);
    } catch (err) {
      console.error('결재선 저장 중 오류 발생:', err);
      setError('결재선 저장 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 결재자 선택 다이얼로그
  const renderApproverDialog = () => {
    return (
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>결재자 선택</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="이름, 부서, 직급으로 검색"
            value={searchKeyword}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>이름</TableCell>
                  <TableCell>부서</TableCell>
                  <TableCell>직급</TableCell>
                  <TableCell>선택</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">검색 결과가 없습니다.</TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.department?.name || '-'}</TableCell>
                      <TableCell>{member.position?.name || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAddApprover(member)}
                          disabled={selectedApprovers.some(approver => approver.id === member.id)}
                        >
                          선택
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading && members.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>결재선 설정</Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      )}

      {/* 선택된 결재자 목록 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">결재 순서</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            결재자 추가
          </Button>
        </Box>

        {selectedApprovers.length === 0 ? (
          <Typography color="textSecondary" sx={{ my: 2 }}>
            선택된 결재자가 없습니다. 결재자를 추가해주세요.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>순서</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>부서</TableCell>
                  <TableCell>직급</TableCell>
                  <TableCell>순서변경</TableCell>
                  <TableCell>삭제</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedApprovers.map((approver, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{approver.name}</TableCell>
                    <TableCell>{approver.department?.name || '-'}</TableCell>
                    <TableCell>{approver.position?.name || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          disabled={index === 0}
                          onClick={() => handleMoveUp(index)}
                        >
                          <ArrowUpIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={index === selectedApprovers.length - 1}
                          onClick={() => handleMoveDown(index)}
                        >
                          <ArrowDownIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveApprover(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 결재선 저장 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onSetupComplete}
          disabled={loading}
        >
          취소
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveApprovalLine}
          disabled={selectedApprovers.length === 0 || loading}
        >
          {loading ? <CircularProgress size={24} /> : '결재선 저장'}
        </Button>
      </Box>

      {/* 결재자 선택 다이얼로그 */}
      {renderApproverDialog()}
    </Paper>
  );
}

export default ApprovalLineSetupComponent;