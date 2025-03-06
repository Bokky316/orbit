import { Button, TextField } from "@mui/material";
import { useState, useEffect } from "react";
import { API_URL } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import useDebounce from '@/hooks/useDebounce';
import KakaoAddressSearch from "@/features/auth/KakaoAddressSearch";


export default function RegisterMember() {
    //  회원가입 정보 상태
    const [credentials, setCredentials] = useState({ birthDate: "2025-02-05"});
    const [member, setMember] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",  // 비밀번호 확인 추가
        phone: "",
        birthDate: "",
        gender: "",
        postalCode: "",     // 우편번호 추가
        roadAddress: "",    // 도로명 주소 추가
        detailAddress: "",  // 상세 주소 추가
    });
    const [email, setEmail] = useState(""); // 이메일 상태
    const debouncedEmail = useDebounce(email, 500); // 500ms 디바운스 적용

    const [emailError, setEmailError] = useState(""); // 이메일 중복 체크 에러 메시지
    const [passwordError, setPasswordError] = useState(""); // 비밀번호 확인 메시지
    const navigate = useNavigate();

    const [verificationCode, setVerificationCode] = useState(""); // 입력받은 인증 코드
    const [isVerified, setIsVerified] = useState(false); // 인증 완료 여부


    // debounce된 이메일 값이 변경될 때마다 실행, 사용자가 입력할 때마다 실행되지 않고 500ms 후에 실행됩니다
    // 즉, 사용자가 입력을 멈추고 500ms 후에 실행됩니다
    useEffect(() => {
        if (debouncedEmail) {
            checkEmail(debouncedEmail);
        }
    }, [debouncedEmail]);

    // 입력 필드 변경 처리
    const onMemberChange = (event) => {
        const { name, value } = event.target;
        setMember({ ...member, [name]: value }); // 입력 필드 값 업데이트

        if (name === "email") {
            setEmail(value); // 이 부분을 추가
        }
    };

    // 비밀번호 확인 체크
    useEffect(() => {
        if (member.confirmPassword) {
            if (member.password === member.confirmPassword) {
                setPasswordError("비밀번호가 일치합니다."); // 초록색 표시
            } else {
                setPasswordError("비밀번호가 맞지 않습니다."); // 빨간색 표시
            }
        } else {
            setPasswordError("");
        }
    }, [member.password, member.confirmPassword]);

    // 이메일 중복 체크
    const checkEmail = (email) => {
        fetch(`${API_URL}members/checkEmail?email=${email}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.status === "duplicate") {
                    setEmailError(data.message);
                } else {
                    setEmailError("");
                }
            })
            .catch((error) => {
                console.error("이메일 중복 체크 중 오류 발생:", error);
                setEmailError("이메일 확인 중 오류가 발생했습니다.");
            });
    };

    /**
         * 이메일 인증 코드 요청
         * - 사용자가 이메일 인증 코드 전송 버튼 클릭 시 실행
         */
    const sendVerificationCode = () => {
        fetch(`${API_URL}email/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: member.email }) // JSON body로 이메일 전달
        })
        .then((response) => response.json()) // JSON 응답으로 변환
        .then((data) => {
            if (data.error) {
                alert(`인증 코드 전송 실패: ${data.details || data.error}`);
            } else {
                alert(data.message);
            }
        })
        .catch((error) => {
            console.error("인증 코드 전송 오류:", error);
            alert("서버 오류가 발생했습니다. 다시 시도해주세요.");
        });
    };

    /**
        * 인증 코드 확인 요청
        * - 사용자가 인증 코드 입력 후 확인 버튼 클릭 시 실행
     */
    const verifyCode = async () => {
        try {
            const response = await fetch(`${API_URL}email/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: verificationCode })
            });

            // 서버 응답을 JSON 형식으로 변환
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "인증 코드 확인 실패"); // 서버에서 온 메시지 표시
            }

            alert(data.message);
            setIsVerified(true); // 이메일 인증 성공 시 상태 업데이트
        } catch (error) {
            console.error("인증 코드 확인 오류:", error.message);
            alert(error.message); // 서버에서 온 오류 메시지를 표시
        }
    };

    /**
        *  회원가입 요청
        * - 사용자가 모든 정보를 입력하고 회원가입 버튼을 클릭 시 실행
     */
    const handleOnSubmit = () => {
        if (member.password !== member.confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        console.log("회원가입 요청 데이터:", member); // ✅ 확인용 로그 추가

        fetch(API_URL + "members/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(member), // ✅ confirmPassword도 포함됨을 확인
        })
        .then(async (response) => {
            const message = await response.text();
            if (response.ok) {
                alert(message);
                navigate("/login");
            } else {
                alert("회원가입 실패: " + message);
            }
        })
        .catch((error) => {
            console.error("회원가입 중 오류 발생:", error);
            alert("서버 오류가 발생했습니다. 다시 시도해주세요.");
        });
    };

    // 카카오 주소 검색 후 선택한 주소를 상태에 저장
    const handleAddressSelect = (data) => {
        console.log("[DEBUG] 선택된 주소 데이터:", data);

        setMember({
            ...member,
            postalCode: data.zonecode,  // 우편번호
            roadAddress: data.roadAddress,  // 도로명 주소
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "20px" }}>
            <TextField
                label="Name"
                name="name"
                value={member.name}
                onChange={onMemberChange}
                style={{ width: "400px", marginBottom: "10px" }}
            />
            <TextField
                label="Email"
                name="email"
                value={member.email}
                onChange={onMemberChange}
                style={{ width: "400px", marginBottom: "10px" }}
                error={!!emailError}
                helperText={emailError}
            />
            <Button
                variant="contained"
                onClick={sendVerificationCode}
                disabled={!member.email || !!emailError}>
                인증 코드 전송
            </Button>
            <TextField
                label="인증 코드 입력"
                name="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                style={{ width: "400px", marginBottom: "10px", marginTop: "10px" }}
            />
            <Button
                variant="contained"
                onClick={verifyCode}
                disabled={!verificationCode}>
                인증 코드 확인
            </Button>
            <TextField
                label="Password"
                name="password"
                type="password"
                value={member.password}
                onChange={onMemberChange}
                style={{ width: "400px", marginBottom: "10px" }}
            />
            <TextField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={member.confirmPassword}
                onChange={onMemberChange}
                style={{ width: "400px", marginBottom: "10px" }}
                error={passwordError === "비밀번호가 맞지 않습니다."}
                helperText={passwordError}
                sx={{ "& .MuiFormHelperText-root": { color: passwordError === "비밀번호가 맞지 않습니다." ? "red" : "green" } }}
            />


             {/* 카카오 주소 검색 컴포넌트 */}
            <div style={{ display: "flex", width: "400px", marginBottom: "10px" }}>
                <TextField label="우편번호" name="postalCode" value={member.postalCode} style={{ flex: 1, marginRight: "10px" }} disabled />
                <KakaoAddressSearch onAddressSelect={handleAddressSelect} />
            </div>

            <TextField
                label="우편번호"
                name="postalCode"
                value={member.postalCode}
                style={{ width: "400px", marginBottom: "10px" }}
                disabled
            />
            <TextField
                label="도로명 주소"
                name="roadAddress"
                value={member.roadAddress}
                style={{ width: "400px", marginBottom: "10px" }}
                disabled
            />
            <TextField
                label="상세 주소"
                name="detailAddress"
                value={member.detailAddress}
                onChange={onMemberChange}
                style={{ width: "400px", marginBottom: "10px" }}
            />

            <TextField
                label="Phone"
                name="phone"
                value={member.phone}
                onChange={onMemberChange}
                style={{ width: "400px", marginBottom: "10px" }}
            />
             <TextField
                label="Birth Date"
                name="birthDate"
                type="date"
                value={credentials.birthDate}
                onChange={onMemberChange}
                style={{ width: "400px", marginBottom: "10px" }}
            />

            <select name="gender" value={member.gender} onChange={onMemberChange} style={{ width: "400px", height: "40px" }}>
                <option value="">성별 선택</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
            </select>

            <Button variant="contained" onClick={handleOnSubmit} disabled={!isVerified}>
                회원가입
            </Button>
        </div>
    );
}
