// src/pages/procurement/ProjectDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteProject } from '@/redux/projectSlice';
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
import { fetchWithAuth } from '@/utils/fetchWithAuth'; // 인증이 필요한 API 호출 함수
import { API_URL } from '@/utils/constants';

/**
 * 프로젝트 상세 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function ProjectDetailPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); // URL에서 프로젝트 ID를 가져옴
    const [project, setProject] = useState(null); // 프로젝트 정보 상태
    const [purchaseRequests, setPurchaseRequests] = useState([]); // 구매 요청 목록 상태

    useEffect(() => {
        // 컴포넌트 마운트 시 프로젝트 상세 정보 및 관련 데이터 로딩
        fetchProjectDetail();
    }, [id]);

    /**
     * 프로젝트 상세 정보 및 관련 데이터 API 호출 함수
     */
    const fetchProjectDetail = async () => {
        try {
            // 1. 프로젝트 상세 정보 가져오기
            const projectResponse = await fetchWithAuth(`${API_URL}projects/${id}`);
            if (!projectResponse.ok) {
                throw new Error(`프로젝트 상세 정보 로딩 실패: ${projectResponse.status}`);
            }
            const projectData = await projectResponse.json();
            setProject(projectData); // 프로젝트 정보 설정

            // 2. 관련 구매 요청 목록 가져오기
            const purchaseRequestsResponse = await fetchWithAuth(`${API_URL}purchase-requests?projectId=${id}`);
            if (!purchaseRequestsResponse.ok) {
                throw new Error(`관련 구매 요청 목록 로딩 실패: ${purchaseRequestsResponse.status}`);
            }
            const purchaseRequestsData = await purchaseRequestsResponse.json();
            setPurchaseRequests(purchaseRequestsData); // 구매 요청 목록 설정
        } catch (error) {
            console.error('프로젝트 상세 정보 로딩 중 오류 발생:', error);
        }
    };

    /**
     * 수정 핸들러
     */
    const handleEdit = () => {
        navigate(`/projects/edit/${id}`); // 프로젝트 수정 페이지로 이동
    };

    /**
     * 삭제 핸들러
     */
    const handleDelete = async () => {
        try {
            // 프로젝트 삭제 API 호출
            const response = await fetchWithAuth(`${API_URL}projects/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`프로젝트 삭제 실패: ${response.status}`);
            }
            dispatch(deleteProject(id)); // Redux 스토어에서 프로젝트 삭제
            navigate('/projects'); // 프로젝트 목록 페이지로 이동
        } catch (error) {
            console.error('프로젝트 삭제 중 오류 발생:', error);
            alert('프로젝트 삭제 중 오류가 발생했습니다.');
        }
    };

    if (!project) {
        return <Typography>Loading...</Typography>; // 데이터 로딩 중 표시
    }

    return (
        <Box sx={{ p: 4 }}>
            {/* 프로젝트 기본 정보 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>프로젝트 정보</Typography>
                <Typography>프로젝트 ID: {project.projectId}</Typography>
                <Typography>프로젝트명: {project.projectName}</Typography>
                <Typography>담당자: {project.managerName}</Typography>
                <Typography>시작일: {project.startDate}</Typography>
                <Typography>종료일: {project.endDate}</Typography>
                <Typography>상태: {project.status}</Typography>
            </Paper>

            {/* 프로젝트 설명 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>프로젝트 설명</Typography>
                <Typography>{project.description}</Typography>
            </Paper>

            {/* 관련 구매 요청 목록 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>관련 구매 요청</Typography>
                <TableContainer>
                    <Table aria-label="관련 구매 요청 테이블">
                        <TableHead>
                            <TableRow>
                                <TableCell>요청번호</TableCell>
                                <TableCell>요청명</TableCell>
                                <TableCell>상태</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {purchaseRequests.map(request => (
                                <TableRow key={request.id}>
                                    <TableCell>{request.id}</TableCell>
                                    <TableCell>{request.title}</TableCell>
                                    <TableCell>{request.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* 액션 버튼 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary" onClick={handleEdit}>
                    수정
                </Button>
                <Button variant="outlined" color="error" onClick={handleDelete}>
                    삭제
                </Button>
            </Box>
        </Box>
    );
}

export default ProjectDetailPage;
