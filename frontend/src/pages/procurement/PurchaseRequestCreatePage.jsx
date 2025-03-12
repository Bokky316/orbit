import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, TextField, Button, Grid, Alert,
    IconButton, List, ListItem, ListItemAvatar, ListItemText,
    Avatar, InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon, Add as AddIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { fetchItems, fetchCategories } from '@/redux/purchaseRequestSlice'; // Redux 액션 추가

const initItem = {
    itemId: '',
    quantity: '',
    unitPrice: '',
    totalPrice: 0,
    deliveryRequestDate: null,
    deliveryLocation: ''
};

/**
 * 구매 요청 생성 페이지 컴포넌트
 */
function PurchaseRequestCreatePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux 상태 가져오기
    const { items: availableItems, categories } = useSelector(state => state.purchaseRequest);
    const loading = useSelector(state => state.purchaseRequest.loading);
    const error = useSelector(state => state.purchaseRequest.error);

    // 현재 로그인한 사용자 정보 가져오기
    const { user } = useSelector(state => state.auth);

    // 프로젝트 목록 상태
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');

    // 공통 필드 상태
    const [businessType, setBusinessType] = useState('');
    const [requestName, setRequestName] = useState('');
    const [requestDate, setRequestDate] = useState(moment());
    const [customer, setCustomer] = useState('');
    const [businessDepartment, setBusinessDepartment] = useState('');
    const [businessManager, setBusinessManager] = useState('');
    const [businessBudget, setBusinessBudget] = useState('');
    const [specialNotes, setSpecialNotes] = useState('');
    const [managerPhoneNumber, setManagerPhoneNumber] = useState('');

    // SI 필드 상태
    const [projectStartDate, setProjectStartDate] = useState(null);
    const [projectEndDate, setProjectEndDate] = useState(null);
    const [projectContent, setProjectContent] = useState('');

    // 유지보수 필드 상태
    const [contractStartDate, setContractStartDate] = useState(null);
    const [contractEndDate, setContractEndDate] = useState(null);
    const [contractAmount, setContractAmount] = useState('');
    const [contractDetails, setContractDetails] = useState('');

    // 물품 필드 상태
    const [items, setItems] = useState([initItem]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);

    // 첨부 파일 상태
    const [attachments, setAttachments] = useState([]);

    useEffect(() => {
        // 컴포넌트 마운트 시 프로젝트 목록 가져오기
        const fetchAllProjects = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}projects`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error(`프로젝트 목록을 가져오는데 실패했습니다: ${response.status}`);
                }
                const projectsData = await response.json();
                setProjects(projectsData);
            } catch (error) {
                alert(`프로젝트 목록을 가져오는 중 오류가 발생했습니다: ${error.message}`);
            }
        };

        fetchAllProjects();

        // Redux를 통해 아이템과 카테고리 목록 가져오기
        dispatch(fetchItems());
        dispatch(fetchCategories());
    }, [dispatch]);

    // 초기에 filteredItems 설정
    useEffect(() => {
        setFilteredItems(availableItems);
    }, [availableItems]);

    // 카테고리 선택 시 아이템 필터링
    useEffect(() => {
        if (selectedCategory) {
            const filtered = availableItems.filter(item => item.categoryId === selectedCategory);
            setFilteredItems(filtered);
        } else {
            setFilteredItems(availableItems);
        }
    }, [selectedCategory, availableItems]);

    // 품목 필드 변경 핸들러
    const handleItemChange = (index, fieldName, value) => {
        const newItems = [...items];
        newItems[index][fieldName] = value;

        // 수량/단가 변경 시 총액 자동 계산
        if (fieldName === 'quantity' || fieldName === 'unitPrice') {
            const quantity = Number(newItems[index].quantity) || 0;
            const unitPrice = Number(newItems[index].unitPrice) || 0;
            newItems[index].totalPrice = quantity * unitPrice;
        }

        setItems(newItems);
    };

    // 아이템 선택 핸들러
    const handleItemSelect = (index, event) => {
        const selectedItemId = event.target.value;
        const selectedItem = availableItems.find(item => item.id === selectedItemId);

        if (selectedItem) {
            const newItems = [...items];
            newItems[index] = {
                ...newItems[index],
                itemId: selectedItem.id,
                itemName: selectedItem.name,
                categoryId: selectedItem.categoryId,
                categoryName: selectedItem.categoryName,
                specification: selectedItem.specification,
                unitParentCode: selectedItem.unitParentCode,
                unitChildCode: selectedItem.unitChildCode,
                unitPrice: selectedItem.standardPrice || 0,
            };

            // 가격이 있으면 총액 자동 계산
            if (selectedItem.standardPrice && newItems[index].quantity) {
                const quantity = Number(newItems[index].quantity) || 0;
                const unitPrice = Number(selectedItem.standardPrice) || 0;
                newItems[index].totalPrice = quantity * unitPrice;
            }

            setItems(newItems);
        }
    };

    // 숫자 입력 핸들러
    const handleNumericItemChange = (index, fieldName) => (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        handleItemChange(index, fieldName, value);
    };

    // 품목 삭제 핸들러
    const handleRemoveItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    /**
     * 폼 제출 핸들러
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 공통 데이터
        let requestData = {
            businessType,
            requestName,
            requestDate: requestDate.format('YYYY-MM-DD'),
            customer,
            businessDepartment,
            businessManager,
            businessBudget: parseFloat(businessBudget.replace(/,/g, '')) || 0,
            specialNotes,
            managerPhoneNumber: managerPhoneNumber || '01044737122',
            // UUID 문자열을 그대로 전송 (숫자로 변환하지 않음)
            projectId: selectedProjectId,

            // 현재 로그인한 사용자 정보 추가
            memberId: user?.id,
            memberName: user?.name,
            memberCompany: user?.companyName,

            // status 필드 대신 직접 매핑된 컬럼 이름으로 지정
            prStatusParent: 'PURCHASE_REQUEST',
            prStatusChild: 'REQUESTED'
        };

        // 사업 구분별 데이터 추가
        if (businessType === 'SI') {
            requestData.projectStartDate = projectStartDate ? projectStartDate.format('YYYY-MM-DD') : null;
            requestData.projectEndDate = projectEndDate ? projectEndDate.format('YYYY-MM-DD') : null;
            requestData.projectContent = projectContent;
        } else if (businessType === 'MAINTENANCE') {
            requestData.contractStartDate = contractStartDate ? contractStartDate.format('YYYY-MM-DD') : null;
            requestData.contractEndDate = contractEndDate ? contractEndDate.format('YYYY-MM-DD') : null;
            requestData.contractAmount = parseFloat(contractAmount.replace(/,/g, '')) || 0;
            requestData.contractDetails = contractDetails;
        } else if (businessType === 'GOODS') {
            // 이 부분에서 오류 발생했던 코드 수정
            requestData.items = items.map(item => {
                // unitPrice가 문자열인지 확인하고 적절히 처리
                let unitPrice = 0;
                if (typeof item.unitPrice === 'string') {
                    unitPrice = parseFloat(item.unitPrice.replace(/,/g, '')) || 0;
                } else if (typeof item.unitPrice === 'number') {
                    unitPrice = item.unitPrice;
                }

                return {
                    itemId: item.itemId, // 여기도 UUID 문자열을 그대로 사용
                    quantity: parseInt(item.quantity) || 0,
                    unitPrice: unitPrice,
                    totalPrice: parseFloat(item.totalPrice) || 0,
                    deliveryRequestDate: item.deliveryRequestDate ? item.deliveryRequestDate.format('YYYY-MM-DD') : null,
                    deliveryLocation: item.deliveryLocation
                };
            });
        }

        try {
            console.log('JSON 요청 전송:', JSON.stringify(requestData, null, 2));

            const response = await fetchWithAuth(`${API_URL}purchase-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const createdRequest = await response.json();
                alert('구매 요청이 성공적으로 생성되었습니다.');

                // 파일 첨부가 있는 경우 처리
                if (attachments.length > 0) {
                    const fileFormData = new FormData();

                    attachments.forEach(file => {
                        fileFormData.append('files', file);
                    });

                    try {
                        // 기본 fetch API 사용 (Content-Type 헤더 생략)
                        const fileResponse = await fetch(`${API_URL}purchase-requests/${createdRequest.id}/attachments`, {
                            method: 'POST',
                            credentials: 'include', // 쿠키 포함
                            body: fileFormData
                        });

                        if (fileResponse.ok) {
                            alert('첨부 파일이 성공적으로 업로드되었습니다.');
                            // 목록 페이지로 이동
                            navigate('/purchase-requests');
                        } else {
                            const errorMsg = await fileResponse.text();
                            alert(`첨부 파일 업로드에 실패했습니다: ${errorMsg}`);
                        }
                    } catch (fileError) {
                        alert(`첨부 파일 업로드 중 오류 발생: ${fileError.message}`);
                    }
                } else {
                    // 첨부 파일이 없는 경우 바로 목록 페이지로 이동
                    navigate('/purchase-requests');
                }
            } else {
                const errorData = await response.text();
                alert(`오류 발생: ${errorData}`);
            }
        } catch (error) {
            alert(`오류 발생: ${error.message}`);
        }
    };

    /**
     * 동적 필드 렌더링 함수
     */
    const renderDynamicFields = () => {
        switch (businessType) {
            case 'SI':
                return (
                    <>
                        <Grid item xs={6}>
                            <DatePicker
                                label="프로젝트 시작일"
                                value={projectStartDate}
                                onChange={setProjectStartDate}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <DatePicker
                                label="프로젝트 종료일"
                                value={projectEndDate}
                                onChange={setProjectEndDate}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="프로젝트 내용"
                                multiline
                                rows={4}
                                value={projectContent}
                                onChange={(e) => setProjectContent(e.target.value)}
                            />
                        </Grid>
                    </>
                );
            case 'MAINTENANCE':
                return (
                    <>
                        <Grid item xs={6}>
                            <DatePicker
                                label="계약 시작일"
                                value={contractStartDate}
                                onChange={setContractStartDate}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <DatePicker
                                label="계약 종료일"
                                value={contractEndDate}
                                onChange={setContractEndDate}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="계약 금액"
                                value={contractAmount}
                                onChange={(e) => setContractAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                                    inputProps: { maxLength: 15 }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="계약 상세 내용"
                                multiline
                                rows={4}
                                value={contractDetails}
                                onChange={(e) => setContractDetails(e.target.value)}
                            />
                        </Grid>
                    </>
                );
            case 'GOODS':
                return (
                    <>
                        {/* 카테고리 선택 필드 추가 */}
                        <Grid item xs={12} sx={{ mb: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel id="category-select-label">카테고리 선택</InputLabel>
                                <Select
                                    labelId="category-select-label"
                                    id="category-select"
                                    value={selectedCategory}
                                    label="카테고리 선택"
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <MenuItem value="">모든 카테고리</MenuItem>
                                    {categories.map(category => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 물품 아이템 레이아웃 수정 */}
                        {items.map((item, index) => (
                          <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2, mx: 0, width: '100%' }}>
                            {/* 아이템 선택 */}
                            <Grid item xs={3}>
                              <FormControl fullWidth size="small">
                                <InputLabel id={`item-select-label-${index}`}>품목 선택 *</InputLabel>
                                <Select
                                  labelId={`item-select-label-${index}`}
                                  id={`item-select-${index}`}
                                  value={item.itemId}
                                  label="품목 선택 *"
                                  onChange={(e) => handleItemSelect(index, e)}
                                  required
                                >
                                  {filteredItems.map(availableItem => (
                                    <MenuItem key={availableItem.id} value={availableItem.id}>
                                      {availableItem.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>

                            {/* 사양 (필드 크기 조정) */}
                            <Grid item xs={2}>
                              <TextField
                                fullWidth
                                size="small"
                                label="사양"
                                value={item.specification || ''}
                                InputProps={{ readOnly: true }}
                              />
                            </Grid>

                            {/* 나머지 필드도 size="small" 추가 */}
                            <Grid item xs={1}>
                              <TextField
                                fullWidth
                                size="small"
                                label="단위"
                                value={item.unitChildCode || ''}
                                InputProps={{ readOnly: true }}
                              />
                            </Grid>

                            <Grid item xs={1}>
                              <TextField
                                fullWidth
                                size="small"
                                label="수량 *"
                                value={item.quantity}
                                onChange={(e) => handleNumericItemChange(index, 'quantity')(e)}
                                required
                              />
                            </Grid>

                            <Grid item xs={2}>
                              <TextField
                                fullWidth
                                size="small"
                                label="단가 *"
                                value={item.unitPrice}
                                onChange={(e) => handleNumericItemChange(index, 'unitPrice')(e)}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                                  inputProps: { maxLength: 15 }
                                }}
                                required
                              />
                            </Grid>

                            <Grid item xs={2}>
                              <TextField
                                fullWidth
                                size="small"
                                label="총액"
                                value={item.totalPrice.toLocaleString()}
                                InputProps={{
                                  readOnly: true,
                                  startAdornment: <InputAdornment position="start">₩</InputAdornment>
                                }}
                              />
                            </Grid>

                            {/* 삭제 버튼을 오른쪽으로 이동 */}
                            <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <IconButton
                                aria-label="delete"
                                onClick={() => handleRemoveItem(index)}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        ))}

                        {/* 품목 추가 버튼 */}
                        <Grid item xs={12} sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start' }}>
                          <Button
                            variant="outlined"
                            onClick={() => setItems([...items, initItem])}
                            startIcon={<AddIcon />}
                            size="small"
                            sx={{ px: 2, py: 1 }}
                          >
                            품목 추가
                          </Button>
                        </Grid>
                    </>
                );

            default:
                return null;
        }
    };

    // 로딩 중 표시
    if (loading && !availableItems.length && !categories.length) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>데이터를 불러오는 중입니다...</Typography>
            </Box>
        );
    }

    // 에러 표시
    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    구매 요청 생성
                </Typography>
                <Paper sx={{ p: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="project-select-label">프로젝트 선택</InputLabel>
                                <Select
                                    labelId="project-select-label"
                                    id="project-select"
                                    value={selectedProjectId}
                                    label="프로젝트 선택"
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    required
                                >
                                    {projects.map((project) => (
                                        <MenuItem key={project.id} value={project.id}>
                                            {project.projectName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {/* 공통 필드 */}
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="요청명 *"
                                name="requestName"
                                value={requestName}
                                onChange={(e) => setRequestName(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <DatePicker
                                label="요청일 *"
                                value={requestDate}
                                onChange={(date) => setRequestDate(date)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="고객사"
                                name="customer"
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업 부서 *"
                                name="businessDepartment"
                                value={businessDepartment}
                                onChange={(e) => setBusinessDepartment(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업 담당자 *"
                                name="businessManager"
                                value={businessManager}
                                onChange={(e) => setBusinessManager(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="business-type-label">사업 구분 *</InputLabel>
                                <Select
                                    labelId="business-type-label"
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                    required
                                >
                                    <MenuItem value="SI">SI</MenuItem>
                                    <MenuItem value="MAINTENANCE">유지보수</MenuItem>
                                    <MenuItem value="GOODS">물품</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업 예산"
                                name="businessBudget"
                                value={businessBudget}
                                onChange={(e) => setBusinessBudget(e.target.value.replace(/[^0-9]/g, ''))}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                                    inputProps: { maxLength: 15 }
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="담당자 핸드폰"
                                name="managerPhoneNumber"
                                value={managerPhoneNumber}
                                onChange={(e) => setManagerPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="특이 사항"
                                name="specialNotes"
                                multiline
                                rows={4}
                                value={specialNotes}
                                onChange={(e) => setSpecialNotes(e.target.value)}
                            />
                        </Grid>

                        {/* 동적 필드 렌더링 */}
                        {renderDynamicFields()}

                        {/* 파일 첨부 */}
                        <Grid item xs={12}>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setAttachments(Array.from(e.target.files))}
                                id="file-upload"
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="file-upload">
                                <Button variant="outlined" component="span" startIcon={<AttachFileIcon />}>
                                    파일 첨부
                                </Button>
                            </label>
                            {attachments.length > 0 && (
                                <>
                                    {attachments.map((file, index) => (
                                        <List key={index} sx={{ mt: 2 }}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar><AttachFileIcon /></Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={file.name}
                                                    secondary={`${(file.size / 1024).toFixed(2)} KB`}
                                                />
                                                {/* 삭제 버튼 */}
                                                <IconButton edge="end" aria-label="delete" onClick={() => {
                                                    const newFiles = [...attachments];
                                                    newFiles.splice(index, 1);
                                                    setAttachments(newFiles);
                                                }}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItem>
                                        </List>
                                    ))}
                                </>
                            )}
                        </Grid>

                        {/* 제출 버튼 */}
                        <Grid item xs={12} sx={{ textAlign: 'right' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                sx={{ mt: 2 }}
                            >
                                제출하기
                            </Button>
                        </Grid>

                    </Grid>
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}

export default PurchaseRequestCreatePage;