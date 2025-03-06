// src/components/ApprovalDetailPage.js

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '@/utils/fetchWithAuth'; // 인증이 필요한 API 호출 함수
import { API_URL } from '@/utils/constants';

/**
 * 결재 상세 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function ApprovalDetailPage() {
    const { id } = useParams(); // URL에서 결재 ID를 가져옴
    const navigate = useNavigate(); // 페이지 이동을 위한 navigate
    const [request, setRequest] = useState(null); // 구매 요청 정보 상태
    const [items, setItems] = useState([]); // 구매 요청 품목 목록 상태
    const [approvals, setApprovals] = useState([]); // 결재 정보 상태
    const [opinion, setOpinion] = useState(''); // 의견 상태

    useEffect(() => {
        // 컴포넌트 마운트 시 결재 상세 정보 및 관련 데이터 로딩
        fetchApprovalDetail();
    }, [id]);

    /**
     * 결재 상세 정보 및 관련 데이터 API 호출 함수
     */
    const fetchApprovalDetail = async () => {
        try {
            // 1. 결재 정보 가져오기
            const approvalResponse = await fetchWithAuth(`${API_URL}approvals/${id}`);
            if (!approvalResponse.ok) {
                throw new Error(`결재 정보 로딩 실패: ${approvalResponse.status}`);
            }
            const approvalData = await approvalResponse.json();

            // 2. 구매 요청 정보 가져오기
            const purchaseRequestResponse = await fetchWithAuth(`${API_URL}purchase-requests/${approvalData.purchaseRequestId}`);
            if (!purchaseRequestResponse.ok) {
                throw new Error(`구매 요청 정보 로딩 실패: ${purchaseRequestResponse.status}`);
            }
            const purchaseRequestData = await purchaseRequestResponse.json();
            setRequest(purchaseRequestData); // 구매 요청 정보 설정

            // 3. 구매 요청 품목 목록 가져오기 (API 엔드포인트가 없으므로 가정)
            // const itemsResponse = await fetchWithAuth(`${API_URL}purchase-requests/${approvalData.purchaseRequestId}/items`);
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

            // 4. 결재 정보 목록 가져오기 (API 엔드포인트가 없으므로 가정)
            // const approvalsResponse = await fetchWithAuth(`${API_URL}approvals/${id}/approvals`);
            // if (!approvalsResponse.ok) {
            //     throw new Error(`결재 정보 목록 로딩 실패: ${approvalsResponse.status}`);
            // }
            // const approvalsData = await approvalsResponse.json();
            // setApprovals(approvalsData); // 결재 정보 목록 설정

            // ** 가짜 데이터로 대체 **
            const approvalsData = [
                { approver: '김부장', status: '승인' },
                { approver: '이사장', status: '대기중' }
            ];
            setApprovals(approvalsData);

        } catch (error) {
            console.error('결재 상세 정보 로딩 중 오류 발생:', error);
        }
    };

    /**
     * 의견 변경 핸들러
     * @param {object} event - 이벤트 객체
     */
    const handleOpinionChange = (event) => {
        setOpinion(event.target.value);
    };

    /**
     * 승인 핸들러
     */
    const handleApprove = async () => {
        // TODO: 승인 API 호출 (API 엔드포인트 및 요청 바디는 백엔드에 따라 달라질 수 있음)
        try {
            // const response = await fetchWithAuth(`${API_URL}approvals/${id}/approve`, {
            //     method: 'POST',
            //     body: JSON.stringify({ opinion: opinion }),
            // });
            // if (!response.ok) {
            //     throw new Error(`승인 실패: ${response.status}`);
            // }
            // console.log('승인 성공');
            // alert('승인되었습니다.');
            // navigate('/approvals'); // 결재 목록 페이지로 이동

            // ** 가짜로 승인 처리**
            alert('승인되었습니다.');
            navigate('/approvals'); // 결재 목록 페이지로 이동
        } catch (error) {
            console.error('승인 중 오류 발생:', error);
            alert('승인 중 오류가 발생했습니다.');
        }
    };

    /**
     * 반려 핸들러
     */
    const handleReject = async () => {
        // TODO: 반려 API 호출 (API 엔드포인트 및 요청 바디는 백엔드에 따라 달라질 수 있음)
        try {
            // const response = await fetchWithAuth(`${API_URL}approvals/${id}/reject`, {
            //     method: 'POST',
            //     body: JSON.stringify({ opinion: opinion }),
            // });
            // if (!response.ok) {
            //     throw new Error(`반려 실패: ${response.status}`);
            // }
            // console.log('반려 성공');
            // alert('반려되었습니다.');
            // navigate('/approvals'); // 결재 목록 페이지로 이동

            // ** 가짜로 반려 처리**
            alert('반려되었습니다.');
            navigate('/approvals'); // 결재 목록 페이지로 이동

        } catch (error) {
            console.error('반려 중 오류 발생:', error);
            alert('반려 중 오류가 발생했습니다.');
        }
    };

    /**
     * 의견 작성 핸들러
     */
    const handleWriteOpinion = () => {
        // TODO: 의견 작성 API 호출 (API 엔드포인트 및 요청 바디는 백엔드에 따라 달라질 수 있음)
        // 백엔드 API 호출 후 필요한 로직 처리
        console.log('의견 작성:', opinion);
        alert('의견이 작성되었습니다.');
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

            {/* 의견 작성란 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>의견</Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={opinion}
                    onChange={handleOpinionChange}
                    placeholder="결재 의견을 작성해주세요."
                />
            </Paper>

            {/* 액션 버튼 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="success" onClick={handleApprove}>
                    승인
                </Button>
                <Button variant="contained" color="error" onClick={handleReject}>
                    반려
                </Button>
                <Button variant="outlined" onClick={handleWriteOpinion}>
                    의견 작성
                </Button>
            </Box>
        </Box>
    );
}

export default ApprovalDetailPage;
