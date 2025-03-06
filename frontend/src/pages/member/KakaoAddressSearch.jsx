import React from "react";
import { Button } from "@mui/material"; // ✅ Material-UI 버튼 적용

export default function KakaoAddressSearch({ onAddressSelect }) {
    const handleAddressSearch = () => {
        new window.daum.Postcode({
            oncomplete: (data) => {
                console.log("📌 [DEBUG] 카카오 주소 선택됨:", data);
                onAddressSelect(data); // 부모 컴포넌트(SubscriptionManagement.jsx)에 주소 전달
            }
        }).open();
    };

    return (
        <Button
            variant="contained"
            onClick={handleAddressSearch}
            sx={{
                marginLeft: "10px",
                height: "100%",  // ✅ 버튼 높이를 우편번호 입력 필드와 동일하게 맞춤
                display: "flex",
                alignItems: "center",  // ✅ 위아래 정렬 맞춤
                whiteSpace: "nowrap"
            }}
        >
            우편번호 검색
        </Button>
    );
}
