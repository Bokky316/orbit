import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { fetchWithAuth } from '@/utils/fetchWithAuth'; // 인증이 필요한 API 호출 함수
import { API_URL } from '@/utils/constants';

/**
 * 구매 요청 상세 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function PurchaseRequestDetailPage() {
    const { id } = useParams(); // URL에서 구매 요청 ID를 가져옴
    const [request, setRequest] = useState(null); // 구매 요청 정보 상태

    useEffect(() => {
        // 컴포넌트 마운트 시 구매 요청 상세 정보 및 관련 데이터 로딩
        fetchPurchaseRequestDetail();
    }, [id]);

    /**
     * 구매 요청 상세 정보 및 관련 데이터 API 호출 함수
     */
    const fetchPurchaseRequestDetail = async () => {
        try {
            // 1. 구매 요청 정보 가져오기
            const purchaseRequestResponse = await fetchWithAuth(`${API_URL}purchase-requests/${id}`);
            if (!purchaseRequestResponse.ok) {
                throw new Error(`구매 요청 정보 로딩 실패: ${purchaseRequestResponse.status}`);
            }
            const purchaseRequestData = await purchaseRequestResponse.json();
            setRequest(purchaseRequestData); // 구매 요청 정보 설정

        } catch (error) {
            console.error('구매 요청 상세 정보 로딩 중 오류 발생:', error);
            // 에러 처리 로직 (예: 사용자에게 알림)
        }
    };

    if (!request) {
        return <Typography>Loading...</Typography>; // 데이터 로딩 중 표시
    }

    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h5" gutterBottom>
                구매 요청 정보
            </Typography>
            <Paper sx={{ padding: 2 }}>
                {/* 구매 요청 기본 정보 */}
                <Typography variant="h6">구매 요청 정보</Typography>
                <Typography>요청번호: {request.id}</Typography>
                <Typography>요청명: {request.requestName}</Typography>
                <Typography>상태: {request.status}</Typography>
                <Typography>요청일: {request.requestDate}</Typography>
                <Typography>고객사: {request.customer}</Typography>
                <Typography>사업부서: {request.businessDepartment}</Typography>
                <Typography>사업담당자: {request.businessManager}</Typography>
                <Typography>사업구분: {request.businessType}</Typography>
                <Typography>사업예산: {request.businessBudget?.toLocaleString()}원</Typography>
                <Typography>특이사항: {request.specialNotes}</Typography>
                <Typography>담당자 핸드폰: {request.managerPhoneNumber}</Typography>
                <Typography>사업시작일: {request.projectStartDate}</Typography>
                <Typography>사업종료일: {request.projectEndDate}</Typography>
                <Typography>사업내용: {request.projectContent}</Typography>
                <Typography>첨부파일: {request.attachments}</Typography>

                {/* 액션 버튼 */}
                <Button variant="contained" color="primary">수정</Button>
                <Button variant="contained" color="success">결재 요청</Button>
            </Paper>
        </Box>
    );
}

export default PurchaseRequestDetailPage;
