import { useDispatch, useSelector } from "react-redux";
import { fetchUserInfo, setUser } from "@/store/authSlice";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/features/auth/fetchWithAuth";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, TextField, Typography, Snackbar } from "@mui/material";
import KakaoAddressSearch from "@/features/auth/KakaoAddressSearch"; // ✅ 카카오 주소 검색 추가
import "@/styles/MyPage.css"; // CSS 파일 import

export default function MyPage() {
    const dispatch = useDispatch(); // Redux 디스패치 가져오기
    // URL 파라미터에서 id 가져오기, App 컴포넌트에서 Route의 path에 설정한 URL 파라미터를 가져옴,
    // 여기서는 미사용 왜냐하면 리덕스 스토어에 보관한 값을 사용, 하지만 다른 형태로 구현시 필요해서 코드 유지함.
    // 여기서 미사용시 App 컴포넌트에서 Route의 path에 설정한 URL 파라미터를 가져오는 코드를 삭제해도 무방함.
    const { id } = useParams(); //
    // 리덕스 스토어에서 사용자 정보 가져오기
    const { user } = useSelector((state) => state.auth);
    // 사용자 정보를 저장할 상태 변수
    const [member, setMember] = useState({
        id: "",
        name: "",
        email: "",
        phone: "",
        postalCode: "",
        roadAddress: "",
        detailAddress: "",
        birthDate: "",
        gender: "",
    });

    const [snackbar, setSnackbar] = useState({ open: false, message: "" });

    /**
     * 컴포넌트가 처음 렌더링될 때 사용자 정보를 불러옴
     * - user가 변경될 때마다 사용자 정보를 다시 불러옴
     */
    useEffect(() => {
        if (user) {
            fetchMemberData(user.id); // url 파라미터로 받은 id를 사용하여 사용자 정보를 불러옴
        }
    }, [user]);

    /**
     * 사용자 정보 불러오기
     */
    const fetchMemberData = async (memberId) => {
        try {
            const response = await fetchWithAuth(`${API_URL}members/${memberId}`, { method: "GET" });
            console.log('fetchMemberData response : ', response);

            if (response.ok) {
                const result = await response.json();
                console.log('fetchMemberData result : ', result);

                const userData = result.data; // 여기를 수정
                setMember({
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    postalCode: userData.postalCode, // ✅ 우편번호
                    roadAddress: userData.roadAddress, // ✅ 도로명 주소
                    detailAddress: userData.detailAddress, // ✅ 상세 주소
                    birthDate: userData.birthDate,
                    gender: userData.gender,
                    points: userData.points,
                });
            } else {
                console.error("사용자 정보 로드 실패:", response.status);
                showSnackbar("사용자 정보를 불러올 수 없습니다.");
            }
        } catch (error) {
            console.error("사용자 정보 로드 중 오류 발생:", error.message);
            showSnackbar("사용자 정보 로드 실패: 네트워크 또는 서버 오류");
        }
    };

    useEffect(() => {
        console.log('Current member state:', member);
    }, [member]);


    /**
     * 사용자 정보 수정 요청 처리
     * @returns {Promise<void>}
     */
    const handleUpdate = async () => {
        try {
            // 사용자 정보 수정 요청
            const response = await fetchWithAuth(`${API_URL}members/${user.id}`, {
                method: "PUT",
                body: JSON.stringify(member),
            });

            if (response.ok) {
                const result = await response.json();

                // 컨트롤러 응답에서 사용자 데이터 추출
                const updatedData = {
                    id: result.id,
                    email: result.email,
                    name: result.name,
                    roles: result.roles,
                };

                console.log("사용자 정보 수정 성공:", updatedData);

                // Redux 상태 업데이트
                dispatch(setUser(updatedData));

                showSnackbar("사용자 정보가 수정되었습니다.");
            } else {
                console.error("사용자 정보 수정 실패:", response.status);
                showSnackbar("사용자 정보 수정 실패");
            }
        } catch (error) {
            console.error("사용자 정보 수정 중 오류 발생:", error.message);
            showSnackbar("사용자 정보 수정 실패: 네트워크 또는 서버 오류");
        }
    };

    const handleInputChange = (event) => {
        setMember({ ...member, [event.target.name]: event.target.value });
    };

    // ✅ 카카오 주소 검색 후 선택된 주소 저장하는 함수
    const handleAddressSelect = (data) => {
        console.log("[DEBUG] 선택된 주소 데이터:", data);

        setMember({
            ...member,
            postalCode: data.zonecode,  // 우편번호
            roadAddress: data.roadAddress,  // 도로명 주소
        });
    };

    // 스낵바 메시지를 표시하는 함수
    const showSnackbar = (message) => {
        setSnackbar({ open: true, message });
    };
    return (
        <div className="mypage-container">
            <Typography variant="h4" className="mypage-title">
                마이페이지
            </Typography>
            <TextField className="input-field" label="Name" name="name" value={member.name} onChange={handleInputChange} fullWidth />
            <TextField className="input-field" label="Email" name="email" value={member.email} disabled fullWidth />
            <TextField className="input-field" label="Phone" name="phone" value={member.phone} onChange={handleInputChange} fullWidth />

            <div className="address-container">
                <TextField
                    className="postal-code"
                    label="우편번호"
                    name="postalCode"
                    value={member.postalCode}
                    disabled
                    InputProps={{
                        style: { textAlign: "left", paddingLeft: "10px" } // ✅ 내부 텍스트 왼쪽 정렬 & 패딩 추가
                    }}
                />
                <KakaoAddressSearch onAddressSelect={handleAddressSelect} className="search-button" />
            </div>

            <TextField className="input-field" label="도로명 주소" name="roadAddress" value={member.roadAddress} disabled fullWidth />
            <TextField className="input-field" label="상세 주소" name="detailAddress" value={member.detailAddress} onChange={handleInputChange} fullWidth />

            <TextField
                className="input-field"
                label="Birth Date"
                name="birthDate"
                type="date"
                value={member.birthDate || ""}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
            />

            <TextField
                className="input-field"
                label="Gender"
                name="gender"
                value={member.gender || ""}
                disabled
                fullWidth
            />
            <TextField
                className="input-field"
                label="Points"
                name="points"
                value={member.points || ''}
                disabled
                InputLabelProps={{ shrink: true }}
                fullWidth
            />
            <Button variant="contained" onClick={handleUpdate} className="save-button">
                저장
            </Button>

            <Snackbar
                open={snackbar.open}
                message={snackbar.message}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                ContentProps={{
                    className: snackbar.message.includes("실패") ? "snackbar-error" : "snackbar-success"
                }}
            />
        </div>
    );
}