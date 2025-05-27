# ORBIT - 통합 구매 관리 시스템 🚀

> **INTEGRATED PURCHASE MANAGEMENT SYSTEM**  
> 기업의 구매 프로세스 전반을 관리하는 통합구매관리 시스템

![ORBIT Logo](https://img.shields.io/badge/ORBIT-Integrated%20Purchase%20Management-blue?style=for-the-badge)
![orbit 사용자 대시보드](https://github.com/user-attachments/assets/54f8f4bb-4063-4370-85ed-8cd49f2a949c)


## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [설치 및 실행](#-설치-및-실행)
- [주요 화면](#-주요-화면)
- [개발 프로세스](#-개발-프로세스)
- [팀원 소개](#-팀원-소개)
- [프로젝트 일정](#-프로젝트-일정)
- [데모 및 링크](#-데모-및-링크)

## 🎯 프로젝트 소개

**ORBIT**는 구매요청부터 결제까지의 전체 프로세스를 일원화하여 업무 효율성을 높이고 비용을 절감하는 것을 목표로 하는 통합 구매 관리 시스템입니다.

### 핵심 가치
- **프로세스 통합**: 구매요청부터 결제까지 모든 단계를 하나의 시스템에서 관리
- **업무 효율성**: 자동화된 워크플로우로 업무 처리 시간 단축
- **비용 절감**: 체계적인 구매 관리를 통한 비용 최적화
- **실시간 모니터링**: 구매 프로세스의 실시간 상태 추적

## ✨ 주요 기능

### 📊 대시보드 & 모니터링
- **구매요청 대시보드**: 총 사용 예산, 상태별 현황, 부서별 통계
- **사용자 대시보드**: 개인별 구매요청 현황 및 최근 활동
- **실시간 현황**: WebSocket을 통한 실시간 데이터 업데이트
- **통계 분석**: 연도별/월별 구매 데이터 분석 및 시각화

### 📝 프로젝트 & 구매요청 관리
- **프로젝트 관리**: 고유 식별자('PRJ-YYMM-XXX'), 예산 관리, 상태 추적
- **구매요청 관리**: SI/유지보수/물품별 맞춤 양식, 자동 계산 기능
- **첨부파일 관리**: 업로드/다운로드/삭제 기능
- **상태 추적**: 요청→접수→업체선정→계약대기 등 세밀한 상태 관리

### ⚡ 결재 시스템
- **다단계 워크플로우**: 부서/직급 기반 결재선 자동 설정
- **결재선 템플릿**: 재사용 가능한 결재선 템플릿 관리
- **실시간 알림**: 결재 요청 및 승인/반려 알림
- **이력 관리**: 모든 결재 과정의 상세 이력 추적

### 🏢 입찰 & 계약 관리
- **입찰 공고**: 자동 번호 생성, 정가제안/가격제안 방식 지원
- **공급업체 관리**: 업체 초대, 참여 관리, 견적서 제출
- **평가 시스템**: 다중 평가 기준, 가중치 적용, 자동 점수 산정
- **계약 체결**: 전자 서명, 계약 상태 추적, 문서 보관

### 📦 발주 & 입고 관리
- **발주 관리**: 계약 연계 자동 생성, 납기일 관리, 상태 모니터링
- **입고 처리**: 발주 정보 연계, 다중 조건 검색, 통계 현황
- **송장 관리**: 자동 생성, 승인 워크플로우, 상태별 관리
- **대금 지불**: 다양한 결제 방법, 증빙 문서 생성, 통합 검색

### 🔧 시스템 관리
- **사용자 관리**: 권한별 접근 제어, 부서/직급 관리
- **품목 관리**: 카테고리별 분류, 코드 기반 관리
- **공통코드 관리**: 상위/하위 코드 체계, CRUD 기능

## 🛠 기술 스택

### Backend
```
Java OpenJDK 17
Spring Boot 3.4.1
Spring Data JPA 3.4.1
Spring Security 3.3.6
JWT 0.9.1 (jjwt)
Redis 6.0
WebSocket
Gradle 8.x
```

### Frontend
```
React 19
Material-UI (MUI)
React Redux 9.2.0
Redux Toolkit 2.6.0
Redux Persist 6.0
Axios 1.8.1
Vite 6.2.0
Recharts 2.15.1
```

### Database & Infrastructure
```
MariaDB 10.0
AWS EC2
AWS RDS
Nginx 1.18
```

### Development Tools
```
IntelliJ IDEA
GitHub
DBeaver
MySQL Workbench
Notion
```

## 🏗 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   프론트엔드     │    │    백엔드       │    │   데이터베이스   │
│   React 19      │◄──►│  Spring Boot    │◄──►│   MariaDB      │
│   Redux         │    │  Spring JPA     │    │   AWS RDS      │
│   Material-UI   │    │  Spring Security│    │                │
└─────────────────┘    │  Redis          │    └─────────────────┘
                       │  WebSocket      │
                       └─────────────────┘
                              ▲
                              │
                       ┌─────────────────┐
                       │ AWS EC2 + Nginx │
                       └─────────────────┘
```

## 🚀 설치 및 실행

### 사전 요구사항
- Java 17+
- Node.js 16+
- MariaDB 10.0+
- Redis 6.0+

### Backend 실행
```bash
# 저장소 클론
git clone https://github.com/Bokky316/orbit.git
cd orbit/backend

# 의존성 설치 및 빌드
./gradlew build

# 애플리케이션 실행
./gradlew bootRun
```

### Frontend 실행
```bash
cd orbit/frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 환경 설정
```properties
# application.yml 예시
spring:
  datasource:
    url: jdbc:mariadb://localhost:3306/orbit
    username: your_username
    password: your_password
  
  redis:
    host: localhost
    port: 6379
    
  security:
    jwt:
      secret: your_jwt_secret
```

## 📱 주요 화면

### 메인 대시보드
- 구매요청 현황 한눈에 보기
- 예산 사용률 및 부서별 통계
- 최근 활동 및 알림

### 구매요청 관리
- 사업 유형별(SI/유지보수/물품) 양식
- 프로젝트 연계 및 예산 검증
- 실시간 상태 업데이트

### 입찰 관리
- 공급업체별 견적 비교
- 평가 기준별 점수 관리
- 낙찰자 선정 및 계약 연계

## 📋 개발 프로세스

### Git Workflow
```bash
# 기능별 브랜치 생성
git checkout -b feat/기능명

# 작은 단위로 커밋
git commit -m "feat: 구매요청 생성 기능 구현"

# Pull Request로 코드 리뷰
```

### 커밋 메시지 규칙
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정

### 명명 규칙
- **클래스**: CamelCase (예: `UserController`)
- **메서드/변수**: camelCase (예: `getUserName`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_COUNT`)
- **패키지**: lowercase (예: `com.example.app`)

## 👥 팀원 소개

| 이름 | 역할 | 담당 기능 |
|------|------|-----------|
| **안재은** | 팀장 | 입찰 관리, 계약 관리, 발주 관리 |
| **장보경** | Backend/Frontend | 구매요청, 결재선, 프로젝트, 대시보드, 인증 |
| **박슬기** | Backend/Frontend | 입고 관리, 송장 관리, 지불 관리, 통계 |
| **김혜미** | Backend/Frontend | 사용자 관리, 협력업체 관리 |

## 📅 프로젝트 일정

```
2025년 2월-3월 (총 4주)

2월 24일-28일: 기획 및 설계
3월 1일-5일:   화면 구현
3월 6일-23일:  기능 구현
3월 24일-26일: 테스트 및 디버깅
3월 27일:      최종 발표
```

## 🎬 데모 및 링크

### 🔗 관련 링크
- **GitHub Repository**: [https://github.com/Bokky316/orbit](https://github.com/Bokky316/orbit)
- **시연 영상**: [https://www.youtube.com/watch/LDKpw45f9QY](https://www.youtube.com/watch/LDKpw45f9QY)

### 📸 주요 기능 스크린샷
> 실제 구현된 화면들의 스크린샷을 여기에 추가하실 수 있습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/기능명`)
3. Commit your Changes (`git commit -m 'feat: 새로운 기능 추가'`)
4. Push to the Branch (`git push origin feat/기능명`)
5. Open a Pull Request

## 📜 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의사항

프로젝트에 대한 문의사항이나 제안사항이 있으시면 언제든 연락해 주세요.

---

**Made with ❤️ by Team 괴도**

*"구매요청부터 결제까지, ORBIT과 함께하는 스마트한 구매 관리"*
