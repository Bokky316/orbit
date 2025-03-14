// src/pages/item/ItemFormPage.jsx
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
  selectItems,
  fetchAllCategories
} from '@redux/itemCategorySlice';

const ItemFormPage = ({ mode = 'create' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const items = useSelector(selectItems);

  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    // 카테고리 목록 미리 로드
    dispatch(fetchAllCategories());

    if (mode === 'edit' && id) {
      // 수정 모드일 때 기존 데이터 가져오기
      const existingItem = items.find(item => item.id === id);

      if (existingItem) {
        setInitialData(existingItem);
      }
    }
  }, [mode, id, items, dispatch]);

  const handleClose = () => {
    // 폼 닫기 시 목록 페이지로 이동
    navigate('/items');
  };

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" gutterBottom>
          {mode === 'create' ? '새 아이템 등록' : '아이템 수정'}
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

export default ItemFormPage;