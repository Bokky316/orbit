// src/pages/category/CategoryListPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  IconButton
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import {
  fetchAllCategories,
  deactivateCategory,
  selectCategories,
  selectItemCategoryLoading
} from '@/redux/itemCategorySlice';

import ItemCategoryForm from '@pages/item/ItemCategoryForm';
import ConfirmDialog from '@components/common/ConfirmDialog';

const CategoryListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categories = useSelector(selectCategories);
  const isLoading = useSelector(selectItemCategoryLoading);

  const [openForm, setOpenForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    navigate(`/categories/edit/${category.id}`);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setOpenConfirmDialog(true);
  };

  const confirmDeleteCategory = async () => {
    if (selectedCategory) {
      await dispatch(deactivateCategory(selectedCategory.id));
      dispatch(fetchAllCategories());
      setOpenConfirmDialog(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">카테고리 관리</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/categories/new')}
        >
          카테고리 추가
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>카테고리명</TableCell>
              <TableCell>설명</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="right">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <Chip
                    label={category.useYn === 'Y' ? '활성' : '비활성'}
                    color={category.useYn === 'Y' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => handleDeleteCategory(category)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={openConfirmDialog}
        title="카테고리 비활성화"
        content="이 카테고리를 비활성화하시겠습니까?"
        onConfirm={confirmDeleteCategory}
        onClose={() => setOpenConfirmDialog(false)}
      />
    </Container>
  );
};

export default CategoryListPage;