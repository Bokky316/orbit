// src/pages/category/CategoryFormPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import ItemCategoryForm from '@pages/item/ItemCategoryForm';
import {
  fetchCategoryDetails,
  selectCategories
} from '@redux/itemCategorySlice';

const CategoryFormPage = ({ mode = 'create' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const categories = useSelector(selectCategories);

  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (mode === 'edit' && id) {
      // 수정 모드일 때 기존 데이터 가져오기
      const existingCategory = categories.find(cat => cat.id === id);

      if (existingCategory) {
        setInitialData(existingCategory);
      } else {
        // 없으면 서버에서 가져오기
        dispatch(fetchCategoryDetails(id));
      }
    }
  }, [mode, id, categories, dispatch]);

  const handleClose = () => {
    // 폼 닫기 시 목록 페이지로 이동
    navigate('/categories');
  };

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" gutterBottom>
          {mode === 'create' ? '새 카테고리 등록' : '카테고리 수정'}
        </Typography>

        <ItemCategoryForm
          initialData={initialData}
          formMode={mode}
          onClose={handleClose}
        />
      </Box>
    </Container>
  );
};

export default CategoryFormPage;