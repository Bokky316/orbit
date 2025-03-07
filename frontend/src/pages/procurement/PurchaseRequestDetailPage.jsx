// src/components/PurchaseRequestDetailPage.js

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer
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
    const [items, setItems] = useState([]); // 구매 요청 품목 목록 상태
    const [approvals, setApprovals] = useState([]); // 결재 정보 상태

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

            // 2. 구매 요청 품목 목록 가져오기 (API 엔드포인트가 없으므로 가정)
            // const itemsResponse = await fetchWithAuth(`${API_URL}purchase-requests/${id}/items`);
            // if (!itemsResponse.ok) {
            //     throw new Error(`구매 요청 품목 목록 로딩 실패: ${itemsResponse.status}`);
            // }
            // const itemsData = await itemsResponse.json();
            // setItems(itemsData); // 구매 요청 품목 목록 설정

            // ** 가짜 데이터로 대체 **
            const itemsData = [
                { name: '품목 A', quantity: 2, unitPrice: 100000, amount: 200000 },
                { name: '품목 B', quantity: 3, unitPrice: 100000, amount: 300000 }
            ];
            setItems(itemsData);

            // 3. 결재 정보 목록 가져오기 (API 엔드포인트가 없으므로 가정)
            // const approvalsResponse = await fetchWithAuth(`${API_URL}purchase-requests/${id}/approvals`);
            // if (!approvalsResponse.ok) {
            //     throw new Error(`결재 정보 목록 로딩 실패: ${approvalsResponse.status}`);
            // }
            // const approvalsData = await approvalsResponse.json();
            // setApprovals(approvalsData); // 결재 정보 목록 설정

            // ** 가짜 데이터로 대체 **
            const approvalsData = [
                { approver: '김부장', status: '대기중' },
                { approver: '이사장', status: '대기중' }
            ];
            setApprovals(approvalsData);

        } catch (error) {
            console.error('구매 요청 상세 정보 로딩 중 오류 발생:', error);
        }
    };

    if (!request) {
        return <Typography>Loading...</Typography>; // 데이터 로딩 중 표시
    }

    return (
        <Box sx={{ p: 4 }}>
            {/* 구매 요청 기본 정보 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>구매 요청 정보</Typography>
                <Typography>요청번호: {request.id}</Typography>
                <Typography>프로젝트명: {request.project?.projectName}</Typography>
                <Typography>요청자: {request.requester?.name}</Typography>
                <Typography>총금액: {request.totalAmount?.toLocaleString()}원</Typography>
                <Typography>요청일: {request.requestDate}</Typography>
                <Typography>상태: {request.status}</Typography>
            </Paper>

            {/* 요청 품목 목록 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>요청 품목</Typography>
                <TableContainer>
                    <Table aria-label="요청 품목 테이블">
                        <TableHead>
                            <TableRow>
                                <TableCell>품목명</TableCell>
                                <TableCell>수량</TableCell>
                                <TableCell>단가</TableCell>
                                <TableCell>금액</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.name}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.unitPrice?.toLocaleString()}원</TableCell>
                                    <TableCell>{item.amount?.toLocaleString()}원</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* 결재 정보 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>결재 정보</Typography>
                <TableContainer>
                    <Table aria-label="결재 정보 테이블">
                        <TableHead>
                            <TableRow>
                                <TableCell>결재자</TableCell>
                                <TableCell>상태</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {approvals.map(approval => (
                                <TableRow key={approval.approver}>
                                    <TableCell>{approval.approver}</TableCell>
                                    <TableCell>{approval.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* 액션 버튼 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary">
                    수정
                </Button>
                <Button variant="contained" color="primary">
                    결재 요청
                </Button>
            </Box>
        </Box>
    );
}

export default PurchaseRequestDetailPage;
