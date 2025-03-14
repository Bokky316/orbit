// src/components/ItemCategoryForm.jsx
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
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  Checkbox
} from '@mui/material';

import {
  createCategory,
  updateCategory,
  createItem,
  updateItem,
  selectCategories,
  selectItemCategoryLoading
} from '@redux/itemCategorySlice';

/**
 * 아이템/카테고리 등록/수정 폼 컴포넌트
 * @param {Object} props
 * @param {Object} props.initialData - 수정 시 초기 데이터
 * @param {string} props.formMode - 폼 모드 ('create' 또는 'edit')
 * @param {Function} props.onClose - 폼 닫기 함수
 */
const ItemCategoryForm = ({ initialData, formMode = 'create', onClose }) => {
  const dispatch = useDispatch();
  const [isCategory, setIsCategory] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Redux 상태에서 카테고리 목록과 로딩 상태 가져오기
  const categoriesFromStore = useSelector(selectCategories);
  const isLoading = useSelector(selectItemCategoryLoading);

  // 카테고리 폼 상태
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    description: '',
    useYn: 'Y'
  });

  // 아이템 폼 상태
  const [itemForm, setItemForm] = useState({
    id: '',
    categoryId: '',
    name: '',
    code: '',
    specification: '',
    standardPrice: 0,
    description: '',
    useYn: 'Y'
  });

  // 컴포넌트 마운트 시 초기 데이터 설정
  useEffect(() => {
    // 수정 모드인 경우 초기 데이터 설정
    if (formMode === 'edit' && initialData) {
      if (initialData.name && !initialData.code) { // 카테고리 수정
        setIsCategory(true);
        setCategoryForm(initialData);
      } else { // 아이템 수정
        setIsCategory(false);
        setItemForm(initialData);
      }
    }
  }, [formMode, initialData]);

  // 폼 유형 변경 핸들러
  const handleFormTypeChange = (e) => {
    setIsCategory(e.target.value === 'category');
    setError(null);
    setSuccess(false);
  };

  // 카테고리 폼 입력 변경 핸들러
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm({
      ...categoryForm,
      [name]: value
    });
  };

  // 아이템 폼 입력 변경 핸들러
  const handleItemInputChange = (e) => {
    const { name, value, type } = e.target;
    setItemForm({
      ...itemForm,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      let result;

      if (isCategory) {
        // 카테고리 등록/수정
        if (formMode === 'create') {
          result = await dispatch(createCategory(categoryForm)).unwrap();
        } else {
          result = await dispatch(updateCategory({
            categoryId: categoryForm.id,
            categoryData: categoryForm
          })).unwrap();
        }
      } else {
        // 아이템 등록/수정
        if (formMode === 'create') {
          result = await dispatch(createItem(itemForm)).unwrap();
        } else {
          result = await dispatch(updateItem({
            itemId: itemForm.id,
            itemData: itemForm
          })).unwrap();
        }
      }

      // 성공 후 처리
      setSuccess(true);

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
        title={formMode === 'create' ? '새 항목 등록' : '항목 수정'}
      />
      <CardContent>
        {/* 폼 유형 선택 (등록 시에만) */}
        {formMode === 'create' && (
          <Box mb={3}>
            <FormControl component="fieldset">
              <FormLabel component="legend">항목 유형</FormLabel>
              <RadioGroup
                row
                name="formType"
                value={isCategory ? 'category' : 'item'}
                onChange={handleFormTypeChange}
              >
                <FormControlLabel
                  value="category"
                  control={<Radio />}
                  label="카테고리"
                />
                <FormControlLabel
                  value="item"
                  control={<Radio />}
                  label="아이템"
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
            {isCategory ? '카테고리가' : '아이템이'} 성공적으로 {formMode === 'create' ? '등록' : '수정'}되었습니다.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {isCategory ? (
            // 카테고리 폼
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="카테고리명"
                  name="name"
                  id="categoryName"
                  placeholder="예: 전자제품, 사무용품"
                  value={categoryForm.name}
                  onChange={handleCategoryInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="카테고리 설명"
                  name="description"
                  id="categoryDescription"
                  placeholder="카테고리에 대한 상세 설명"
                  value={categoryForm.description || ''}
                  onChange={handleCategoryInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={categoryForm.useYn === 'Y'}
                      onChange={(e) => {
                        setCategoryForm({
                          ...categoryForm,
                          useYn: e.target.checked ? 'Y' : 'N'
                        });
                      }}
                      name="useYn"
                      id="categoryUseYn"
                    />
                  }
                  label="활성화"
                />
              </Grid>
            </Grid>
          ) : (
            // 아이템 폼
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="categoryLabel">카테고리 *</InputLabel>
                  <Select
                    labelId="categoryLabel"
                    id="categoryId"
                    name="categoryId"
                    value={itemForm.categoryId}
                    onChange={handleItemInputChange}
                    required
                    label="카테고리 *"
                  >
                    <MenuItem value="">카테고리를 선택하세요</MenuItem>
                    {categoriesFromStore.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="아이템명"
                  name="name"
                  id="itemName"
                  placeholder="예: 노트북, 연필"
                  value={itemForm.name}
                  onChange={handleItemInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="아이템 코드"
                  name="code"
                  id="itemCode"
                  placeholder="예: NB001, PEN001"
                  value={itemForm.code}
                  onChange={handleItemInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="규격"
                  name="specification"
                  id="itemSpecification"
                  placeholder="예: 15인치, HB"
                  value={itemForm.specification || ''}
                  onChange={handleItemInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="표준 가격"
                  name="standardPrice"
                  id="itemStandardPrice"
                  value={itemForm.standardPrice}
                  onChange={handleItemInputChange}
                  inputProps={{ min: 0, step: 0.01 }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="아이템 설명"
                  name="description"
                  id="itemDescription"
                  placeholder="아이템에 대한 상세 설명"
                  value={itemForm.description || ''}
                  onChange={handleItemInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={itemForm.useYn === 'Y'}
                      onChange={(e) => {
                        setItemForm({
                          ...itemForm,
                          useYn: e.target.checked ? 'Y' : 'N'
                        });
                      }}
                      name="useYn"
                      id="itemUseYn"
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

export default ItemCategoryForm;