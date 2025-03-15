import React, { useEffect, useState } from "react";

export default function KakaoAddressSearch({ onAddressSelect }) {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [scriptLoadError, setScriptLoadError] = useState(false);

    useEffect(() => {
        // 이미 스크립트가 로드되어 있는지 확인
        if (window.daum && window.daum.Postcode) {
            setIsScriptLoaded(true);
            return;
        }

        // 카카오 우편번호 스크립트 동적 로드
        const script = document.createElement('script');
        script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        script.async = true;

        script.onload = () => {
            console.log('Daum Postcode script loaded successfully');
            setIsScriptLoaded(true);
            setScriptLoadError(false);
        };

        script.onerror = () => {
            console.error('Failed to load Daum Postcode script');
            setIsScriptLoaded(false);
            setScriptLoadError(true);
        };

        document.body.appendChild(script);

        return () => {
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handleAddressSearch = () => {
        // 스크립트 로드 상태 및 오류 확인
        if (!isScriptLoaded) {
            if (scriptLoadError) {
                alert('주소 검색 서비스 로딩에 실패했습니다. 네트워크 연결을 확인해주세요.');
            } else {
                alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            }
            return;
        }

        // 명시적으로 window.daum 객체 확인
        if (window.daum && window.daum.Postcode) {
            try {
                new window.daum.Postcode({
                    oncomplete: (data) => {
                        console.log("📌 주소 선택됨:", data);
                        onAddressSelect({
                            zonecode: data.zonecode,  // 우편번호
                            roadAddress: data.roadAddress,  // 도로명 주소
                            jibunAddress: data.jibunAddress  // 지번 주소 (필요시)
                        });
                    },
                    onclose: () => {
                        console.log('주소 검색 창 닫힘');
                    }
                }).open();
            } catch (error) {
                console.error('주소 검색 중 오류 발생:', error);
                alert('주소 검색 중 문제가 발생했습니다.');
            }
        } else {
            console.error('Daum Postcode 객체를 찾을 수 없습니다.');
            alert('주소 검색 서비스 로딩 중 문제가 발생했습니다.');
        }
    };

    return (
        <button
            type="button"
            onClick={handleAddressSearch}
            disabled={!isScriptLoaded}
            style={{
                padding: '10px 15px',
                backgroundColor: isScriptLoaded ? '#1976d2' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isScriptLoaded ? 'pointer' : 'not-allowed'
            }}
        >
            {scriptLoadError ? '로딩 실패' : (isScriptLoaded ? '우편번호 검색' : '로딩 중...')}
        </button>
    );
}