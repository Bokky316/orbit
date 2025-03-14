// src/components/CommonCodeForm.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';

import {
  fetchAllCommonCodes,
  fetchParentCodes,
  createParentCode,
  updateParentCode,
  createChildCode,
  updateChildCode,
  selectParentCodes,
  selectCommonCodeLoading
} from '@redux/commonCodeSlice';

/**
 * 공통 코드 등록/수정 폼 컴포넌트
 * @param {Object} props
 * @param {Object} props.initialData - 수정 시 초기 데이터
 * @param {string} props.formMode - 폼 모드 ('create' 또는 'edit')
 * @param {Function} props.onClose - 폼 닫기 함수
 */
const CommonCodeForm = ({ initialData, formMode = 'create', onClose }) => {
  const dispatch = useDispatch();
  const [isParentForm, setIsParentForm] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Redux 상태에서 부모 코드 목록과 로딩 상태 가져오기
  const parentCodesFromStore = useSelector(selectParentCodes);
  const isLoading = useSelector(selectCommonCodeLoading);

  // 부모 코드 폼 상태
  const [parentForm, setParentForm] = useState({
    entityType: '',
    codeGroup: '',
    codeName: '',
    description: '',
    isActive: true
  });

  // 자식 코드 폼 상태
  const [childForm, setChildForm] = useState({
    parentCodeId: '',
    codeValue: '',
    codeName: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });

  // 컴포넌트 마운트 시 부모 코드 목록 가져오기
  useEffect(() => {
    if (!isParentForm) {
      dispatch(fetchParentCodes());
    }

    // 수정 모드인 경우 초기 데이터 설정
    if (formMode === 'edit' && initialData) {
      if (initialData.codeGroup) { // 부모 코드 수정
        setIsParentForm(true);
        setParentForm(initialData);
      } else { // 자식 코드 수정
        setIsParentForm(false);
        setChildForm(initialData);
      }
    }
  }, [formMode, initialData, isParentForm, dispatch]);

  // 폼 유형 변경 핸들러
  const handleFormTypeChange = (e) => {
    setIsParentForm(e.target.value === 'parent');
    setError(null);
    setSuccess(false);

    // 자식 코드 폼으로 변경 시 부모 코드 목록 조회
    if (e.target.value === 'child') {
      dispatch(fetchParentCodes());
    }
  };

  // 부모 코드 폼 입력 변경 핸들러
  const handleParentInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setParentForm({
      ...parentForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 자식 코드 폼 입력 변경 핸들러
  const handleChildInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setChildForm({
      ...childForm,
      [name]: type === 'checkbox' ? checked :
              name === 'displayOrder' ? parseInt(value, 10) : value
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      let result;

      if (isParentForm) {
        // 부모 코드 등록/수정
        if (formMode === 'create') {
          result = await dispatch(createParentCode(parentForm)).unwrap();
        } else {
          result = await dispatch(updateParentCode({
            id: initialData.id,
            parentCodeData: parentForm
          })).unwrap();
        }
      } else {
        // 자식 코드 등록/수정
        if (formMode === 'create') {
          result = await dispatch(createChildCode(childForm)).unwrap();
        } else {
          result = await dispatch(updateChildCode({
            id: initialData.id,
            childCodeData: childForm
          })).unwrap();
        }
      }

      // 성공 후 처리
      setSuccess(true);
      dispatch(fetchAllCommonCodes()); // 공통 코드 목록 갱신

      // 3초 후 폼 닫기
      setTimeout(() => {
        if (onClose) onClose();
      }, 3000);

    } catch (err) {
      setError(err.message || '저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <Card>
      <CardHeader
        title={formMode === 'create' ? '새 공통 코드 등록' : '공통 코드 수정'}
      />
      <CardContent>
        {/* 폼 유형 선택 (등록 시에만) */}
        {formMode === 'create' && (
          <Box mb={3}>
            <FormControl component="fieldset">
              <FormLabel component="legend">코드 유형</FormLabel>
              <RadioGroup
                row
                name="formType"
                value={isParentForm ? 'parent' : 'child'}
                onChange={handleFormTypeChange}
              >
                <FormControlLabel
                  value="parent"
                  control={<Radio />}
                  label="상위 코드"
                />
                <FormControlLabel
                  value="child"
                  control={<Radio />}
                  label="하위 코드"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {/* 성공 메시지 */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {isParentForm ? '상위 코드가' : '하위 코드가'} 성공적으로 {formMode === 'create' ? '등록' : '수정'}되었습니다.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* 상위 코드 폼 */}
          {isParentForm ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="엔티티 유형"
                  name="entityType"
                  id="entityType"
                  placeholder="예: PROJECT, PURCHASE_REQUEST"
                  value={parentForm.entityType}
                  onChange={handleParentInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="코드 그룹"
                  name="codeGroup"
                  id="codeGroup"
                  placeholder="예: STATUS, TYPE"
                  value={parentForm.codeGroup}
                  onChange={handleParentInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="코드명"
                  name="codeName"
                  id="parentCodeName"
                  placeholder="예: 프로젝트 상태"
                  value={parentForm.codeName}
                  onChange={handleParentInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="설명"
                  name="description"
                  id="parentDescription"
                  placeholder="상위 코드에 대한 설명"
                  value={parentForm.description || ''}
                  onChange={handleParentInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={parentForm.isActive}
                      onChange={handleParentInputChange}
                      name="isActive"
                      id="parentIsActive"
                    />
                  }
                  label="활성화"
                />
              </Grid>
            </Grid>
          ) : (
            /* 하위 코드 폼 */
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="parentCodeLabel">상위 코드 *</InputLabel>
                  <Select
                    labelId="parentCodeLabel"
                    id="parentCodeId"
                    name="parentCodeId"
                    value={childForm.parentCodeId}
                    onChange={handleChildInputChange}
                    required
                    disabled={isLoading}
                    label="상위 코드 *"
                  >
                    <MenuItem value="">상위 코드를 선택하세요</MenuItem>
                    {parentCodesFromStore.map(parent => (
                      <MenuItem key={parent.id} value={parent.id}>
                        {parent.entityType}-{parent.codeGroup} ({parent.codeName})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {isLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="caption">상위 코드 로딩 중...</Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="코드값"
                  name="codeValue"
                  id="codeValue"
                  placeholder="예: REGISTERED, IN_PROGRESS"
                  value={childForm.codeValue}
                  onChange={handleChildInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="코드명"
                  name="codeName"
                  id="childCodeName"
                  placeholder="예: 등록, 진행중"
                  value={childForm.codeName}
                  onChange={handleChildInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="설명"
                  name="description"
                  id="childDescription"
                  placeholder="하위 코드에 대한 설명"
                  value={childForm.description || ''}
                  onChange={handleChildInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="표시 순서"
                  name="displayOrder"
                  id="displayOrder"
                  value={childForm.displayOrder}
                  onChange={handleChildInputChange}
                  inputProps={{ min: 0 }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={childForm.isActive}
                      onChange={handleChildInputChange}
                      name="isActive"
                      id="childIsActive"
                    />
                  }
                  label="활성화"
                />
              </Grid>
            </Grid>
          )}
        </form>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ mr: 1 }}
        >
          취소
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {formMode === 'create' ? '등록' : '수정'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default CommonCodeForm;