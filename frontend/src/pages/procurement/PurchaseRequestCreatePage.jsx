import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createPurchaseRequest } from '@/redux/purchaseRequestSlice';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    Alert, // Alert 컴포넌트 추가
} from '@mui/material';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

/**
 * 구매 요청 생성 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function PurchaseRequestCreatePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // 상태 변수 정의 (이미지, OCR 정보 기반)
    const [requestName, setRequestName] = useState(''); // 사업명 (요청명)
    const [requestDate, setRequestDate] = useState(''); // 요청일
    const [customer, setCustomer] = useState(''); // 고객사
    const [businessDepartment, setBusinessDepartment] = useState(''); // 사업부서
    const [businessManager, setBusinessManager] = useState(''); // 사업담당자
    const [businessType, setBusinessType] = useState(''); // 사업구분
    const [businessBudget, setBusinessBudget] = useState(''); // 사업예산
    const [specialNotes, setSpecialNotes] = useState(''); // 특기사항
    const [managerPhoneNumber, setManagerPhoneNumber] = useState(''); // 담당자 핸드폰
    const [projectStartDate, setProjectStartDate] = useState(''); // 납품요청일
    const [projectEndDate, setProjectEndDate] = useState(''); //
    const [projectContent, setProjectContent] = useState(''); //
    const [attachments, setAttachments] = useState(''); // 첨부파일
    const [items, setItems] = useState([{ //품목, 사양, 단위, 수량, 단가, 금액, 납품요청일, 납품장소
        itemName: '',
        specification: '',
        unit: '',
        quantity: '',
        unitPrice: '',
        totalPrice: '',
        deliveryRequestDate: '',
        deliveryLocation: ''
    }]);

    // 에러 상태 변수 정의
    const [requestNameError, setRequestNameError] = useState('');
    const [businessDepartmentError, setBusinessDepartmentError] = useState(''); // 사업 부서 에러 상태
    const [businessManagerError, setBusinessManagerError] = useState(''); // 사업 담당자 에러 상태
    const [requestError, setRequestError] = useState(''); // 요청 에러 상태 추가

    // 현재 로그인한 사용자 정보 가져오기 (Redux 스토어에서)
    const currentUser = useSelector(state => state.auth.user);

    useEffect(() => {
        // 컴포넌트 마운트 시 요청일 자동 생성
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setRequestDate(`${year}-${month}-${day}`);

        // 현재 사용자 정보가 있으면 등록자 설정
        if (currentUser) {
            // setRequesterId(currentUser.id); // 더 이상 필요 없음
        }
    }, [currentUser]);

    // 폼 제출 핸들러
    const handleSubmit = async (event) => {
        event.preventDefault();

        // 유효성 검사
        let isValid = true;
        if (!requestName) {
            setRequestNameError('요청명은 필수 입력 값입니다.');
            isValid = false;
        } else {
            setRequestNameError('');
        }
        if (!businessDepartment) {
            setBusinessDepartmentError('사업 부서는 필수 입력 값입니다.');
            isValid = false;
        } else {
            setBusinessDepartmentError('');
        }
        if (!businessManager) {
            setBusinessManagerError('사업 담당자는 필수 입력 값입니다.');
            isValid = false;
        } else {
            setBusinessManagerError('');
        }

        if (!isValid) {
            return;
        }

        // 폼 데이터 객체 생성
        const formData = {
            requestName,
            requestDate,
            customer,
            businessDepartment,
            businessManager,
            businessType,
            businessBudget,
            specialNotes,
            managerPhoneNumber,
            projectStartDate,
            projectEndDate,
            projectContent,
            attachments,
            purchaseRequestItemDTOs: [], // PurchaseRequestItemDTO 목록 추가 (빈 배열로 초기화)
        };

        try {
            // Redux 액션 디스패치
            await dispatch(createPurchaseRequest(formData)).unwrap();

            // 구매 요청 목록 페이지로 이동
            navigate('/purchase-requests');
        } catch (error) {
            console.error("Failed to create purchase request:", error);
            setRequestError("구매 요청 등록에 실패했습니다. 다시 시도해주세요."); // 에러 메시지 설정
        }
    };


    // 폼 필드 변경 핸들러
    const handleChange = (event) => {
        const { name, value } = event.target;
        switch (name) {
            case 'requestName':
                setRequestName(value);
                break;
            case 'requestDate':
                setRequestDate(value);
                break;
            case 'customer':
                setCustomer(value);
                break;
            case 'businessDepartment':
                setBusinessDepartment(value);
                break;
            case 'businessManager':
                setBusinessManager(value);
                break;
            case 'businessType':
                setBusinessType(value);
                break;
            case 'businessBudget':
                setBusinessBudget(value);
                break;
            case 'specialNotes':
                setSpecialNotes(value);
                break;
            case 'managerPhoneNumber':
                setManagerPhoneNumber(value);
                break;
            case 'projectStartDate':
                setProjectStartDate(value);
                break;
            case 'projectEndDate':
                setProjectEndDate(value);
                break;
            case 'projectContent':
                setProjectContent(value);
                break;
            case 'attachments':
                setAttachments(value);
                break;
            default:
                break;
        }
    };
     const handleItemChange = (e, index) => {
        const { name, value } = e.target;
        const list = [...items];
        list[index][name] = value;
        setItems(list);
    };

      const handleRemoveItem = index => {
        setItems(items.filter((s, i) => i !== index));
    };

    const handleAddItem = () => {
        setItems([...items, { itemName: '', specification: '', unit: '', quantity: '', unitPrice: '', totalPrice: '', deliveryRequestDate: '', deliveryLocation: '' }]);
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                구매 요청 생성
            </Typography>
            <Paper elevation={2} sx={{ padding: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                         {/* 요청명 입력 필드 추가 */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="사업명 (요청명)"
                                name="requestName"
                                value={requestName}
                                onChange={handleChange}
                                error={!!requestNameError}
                                helperText={requestNameError}
                                required // 필수 입력 필드 지정
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="요청일"
                                name="requestDate"
                                value={requestDate}
                                InputProps={{
                                    readOnly: true,
                                }}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="고객사"
                                name="customer"
                                value={customer}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업부서"
                                name="businessDepartment"
                                value={businessDepartment}
                                onChange={handleChange}
                                required
                                error={!!businessDepartmentError}
                                helperText={businessDepartmentError}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업담당자"
                                name="businessManager"
                                value={businessManager}
                                onChange={handleChange}
                                required
                                error={!!businessManagerError}
                                helperText={businessManagerError}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업구분"
                                name="businessType"
                                value={businessType}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업예산"
                                name="businessBudget"
                                value={businessBudget}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="담당자 핸드폰"
                                name="managerPhoneNumber"
                                value={managerPhoneNumber}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업 시작일"
                                name="projectStartDate"
                                value={projectStartDate}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업 종료일"
                                name="projectEndDate"
                                value={projectEndDate}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="사업내용"
                                name="projectContent"
                                multiline
                                rows={4}
                                value={projectContent}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="첨부파일"
                                name="attachments"
                                value={attachments}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="특기사항"
                                name="specialNotes"
                                multiline
                                rows={4}
                                value={specialNotes}
                                onChange={handleChange}
                            />
                        </Grid>
                        {/* 물품 정보 입력 필드 추가 */}
                        <Grid item xs={12}>
                            <Typography variant="h6">물품 정보</Typography>
                            {items.map((item, index) => (
                                <Grid container spacing={2} key={index} alignItems="center">
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            label="품목"
                                            name="itemName"
                                            value={item.itemName}
                                            onChange={e => handleItemChange(e, index)}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            label="사양"
                                            name="specification"
                                            value={item.specification}
                                            onChange={e => handleItemChange(e, index)}
                                        />
                                    </Grid>
                                    <Grid item xs={1}>
                                        <TextField
                                            fullWidth
                                            label="단위"
                                            name="unit"
                                            value={item.unit}
                                            onChange={e => handleItemChange(e, index)}
                                        />
                                    </Grid>
                                    <Grid item xs={1}>
                                        <TextField
                                            fullWidth
                                            label="수량"
                                            name="quantity"
                                            value={item.quantity}
                                            onChange={e => handleItemChange(e, index)}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            label="단가"
                                            name="unitPrice"
                                            value={item.unitPrice}
                                            onChange={e => handleItemChange(e, index)}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            label="금액"
                                            name="totalPrice"
                                            value={item.totalPrice}
                                            onChange={e => handleItemChange(e, index)}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            label="납품요청일"
                                            name="deliveryRequestDate"
                                            value={item.deliveryRequestDate}
                                            onChange={e => handleItemChange(e, index)}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            label="납품장소"
                                            name="deliveryLocation"
                                            value={item.deliveryLocation}
                                            onChange={e => handleItemChange(e, index)}
                                        />
                                    </Grid>
                                    <Grid item xs={1}>
                                        <Button variant="contained" color="secondary" onClick={() => handleRemoveItem(index)}>
                                            삭제
                                        </Button>
                                    </Grid>
                                </Grid>
                            ))}
                            <Button variant="contained" color="primary" onClick={handleAddItem}>
                                물품 추가
                            </Button>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                            >
                                저장
                            </Button>
                        </Grid>
                    </Grid>
                </form>
                {/* 요청 실패 시 에러 메시지 표시 */}
                {requestError && (
                    <Alert severity="error">{requestError}</Alert>
                )}
            </Paper>
        </Box>
    );
}

export default PurchaseRequestCreatePage;
