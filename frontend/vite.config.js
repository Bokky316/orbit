import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 백엔드 서버 주소
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),              // 프로젝트 소스 루트 디렉토리
      '@components': path.resolve(__dirname, 'src/components'),  // 재사용 가능한 UI 컴포넌트
      '@features': path.resolve(__dirname, 'src/features'),      // 주요 기능별 모듈 (예: 인증, 설문, 상품, 장바구니)
      '@pages': path.resolve(__dirname, 'src/pages'),            // 페이지 단위 컴포넌트(앱 컴포넌트에 추가되는 최상위 컴포넌트! 루트~
      '@layouts': path.resolve(__dirname, 'src/layouts'),        // 레이아웃 관련 컴포넌트 (예: Header, Footer)
      '@hooks': path.resolve(__dirname, 'src/hooks'),            // 커스텀 React 훅
      '@utils': path.resolve(__dirname, 'src/utils'),            // 유틸리티 함수 (예: 포맷터, 유효성 검사)
      '@styles': path.resolve(__dirname, 'src/styles'),          // 전역 스타일 및 스타일 관련 파일
      '@redux': path.resolve(__dirname, 'src/redux'),            // Redux 관련 파일 (슬라이스, 스토어 설정)
      '@assets': path.resolve(__dirname, 'src/assets'),          // 정적 자산 (이미지, 폰트 등)
    },
  },

  define: {
    global: 'window',  // global 변수를 window로 매핑하여 Vite에서 인식할 수 있도록 설정
  }
})
