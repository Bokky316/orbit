import React from 'react';
import { Typography, Container, Paper, Box, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate  } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {useEffect} from "react";

/**
 * 권한이 없는 사용자가 접근했을 때 보여지는 페이지
 * @returns {JSX.Element}
 * @constructor
 */
const UnauthorizedPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux 상태 확인
    const { user, isLoggedIn } = useSelector((state) => state.auth);

    return (
        <Container maxWidth="sm">
            <Paper
                elevation={6}
                sx={{
                    padding: '40px',
                    marginTop: '100px',
                    textAlign: 'center',
                    borderRadius: '15px',
                    backgroundColor: '#f8f9fa'
                }}
            >
                <Box sx={{ marginBottom: '30px' }}>
                    <LockIcon sx={{ fontSize: 60, color: '#d32f2f' }} />
                </Box>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                    접근 권한 없음
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: '30px', color: '#555' }}>
                    죄송합니다. 이 페이지에 접근할 권한이 없습니다.<br />
                    필요한 경우 관리자에게 문의해 주세요.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/')}
                    sx={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        fontSize: '1rem'
                    }}
                >
                    홈으로 돌아가기
                </Button>
            </Paper>
        </Container>
    );
};

export default UnauthorizedPage;
