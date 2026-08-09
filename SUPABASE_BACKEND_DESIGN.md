# FLOCA 코칭 상담 프로그램 - Supabase 백엔드 설계서

## 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [프론트엔드 구조 분석](#2-프론트엔드-구조-분석)
3. [사용자 유형 및 권한](#3-사용자-유형-및-권한)
4. [기능 구현 현황](#4-기능-구현-현황)
5. [사용자 흐름](#5-사용자-흐름)
6. [데이터 엔티티 정의](#6-데이터-엔티티-정의)
7. [데이터베이스 스키마](#7-데이터베이스-스키마)
8. [PostgreSQL 마이그레이션](#8-postgresql-마이그레이션)
9. [RLS 정책](#9-rls-정책)
10. [Storage 설계](#10-storage-설계)
11. [Realtime 설계](#11-realtime-설계)
12. [프론트엔드 연동 계획](#12-프론트엔드-연동-계획)

---

## 1. 프로젝트 개요

### 서비스 설명
**FLOCA**는 ADHD 특성을 가진 분들의 실행력 회복을 돕는 전문 코칭 서비스입니다.

### 기술 스택
| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19.1.0 + Vite |
| 라우팅 | React Router DOM 7.18.1 |
| 상태관리 | Zustand 5.0.14 (persist) |
| 스타일링 | TailwindCSS 4.3.3 |
| 아이콘 | Lucide React 1.24.0 |
| 백엔드(예정) | Supabase JS 2.110.7 |

### 핵심 비즈니스 로직
- **패키지 시스템**: starter(3회기/1주), basic(5회기/2주), premium(10회기/4주)
- **ASRS 자가진단**: WHO 기반 18문항 ADHD 자가진단
- **코칭 효과 측정**: 5개 카테고리(실행력, 루틴, 시간관리, 자기효능감, 커리어) 각 3문항

---

## 2. 프론트엔드 구조 분석

### 디렉토리 구조
```
src/
├── App.jsx                 # 라우팅 설정
├── main.jsx               # 진입점
├── components/            # 재사용 컴포넌트 (45개 파일)
│   ├── coach/             # 코치용 컴포넌트
│   ├── coachee/           # 피코치용 컴포넌트
│   ├── common/            # 공용 컴포넌트
│   ├── layout/            # 레이아웃
│   ├── messages/          # 메시지 관련
│   └── schedule/          # 일정 관련
├── pages/                 # 페이지 (22개 파일)
│   ├── coach/             # 코치 페이지
│   └── coachee/           # 피코치 페이지
├── data/                  # 목데이터 (4개 파일)
├── lib/                   # 서비스/유틸
└── store/                 # Zustand 상태관리
```

### 라우팅 구조

#### Public Routes (인증 불필요)
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/login` | LoginPage | 로그인 |
| `/signup` | SignupPage | 회원가입 |

#### Onboarding Routes (로그인 필요, 온보딩 미완료)
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/onboarding` | OnboardingPage | 설문 + ASRS 자가진단 |
| `/analysis` | AnalysisResultPage | 분석 결과 |
| `/self-intro` | SelfIntroPage | 자기소개 |
| `/select-coach` | CoachSelectionPage | 코치 선택 |
| `/match-complete` | MatchCompletePage | 매칭 완료 |

#### Coachee Routes (피코치 전용)
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/coachee` | DashboardPage | 대시보드 |
| `/coachee/goals` | GoalsPage | 목표 |
| `/coachee/tasks` | TasksPage | 과제 |
| `/coachee/schedule` | SchedulePage | 일정 |
| `/coachee/reflections` | ReflectionsPage | 성찰 일지 |
| `/coachee/messages` | MessagesPage | 메시지 |
| `/coachee/asrs-test` | ASRSTestPage | ASRS 테스트 |
| `/coachee/survey` | SurveyPage | 설문 |

#### Coach Routes (코치 전용)
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/coach` | DashboardPage | 대시보드 |
| `/coach/coachees` | CoacheesPage | 피코치 목록 |
| `/coach/coachees/:id` | CoacheeDetailPage | 피코치 상세 |
| `/coach/tasks` | TasksPage | 과제 관리 |
| `/coach/sessions` | SessionPage | 세션 관리 |
| `/coach/schedule` | SchedulePage | 일정 관리 |
| `/coach/messages` | MessagesPage | 메시지 |

---

## 3. 사용자 유형 및 권한

### 역할 정의
```typescript
type UserRole = 'coach' | 'coachee'
```

### 권한 매트릭스

| 기능 | Coach | Coachee |
|------|-------|---------|
| 자신의 프로필 조회/수정 | ✅ | ✅ |
| ASRS 자가진단 | ❌ | ✅ |
| 사전/사후 설문 | ❌ | ✅ |
| 코치 선택 | ❌ | ✅ |
| 담당 피코치 목록 조회 | ✅ | ❌ |
| 피코치 상세정보 조회 | ✅ (담당만) | ❌ |
| 세션 예약 생성 | ✅ | ✅ |
| 세션 일지 작성 | ✅ | ❌ |
| 과제 생성/수정 | ✅ | ❌ |
| 과제 완료 보고 | ❌ | ✅ |
| 과제 리마인더 전송 | ✅ | ❌ |
| 메시지 전송 | ✅ | ✅ |
| 성찰 일지 작성 | ❌ | ✅ |
| 성찰 일지 조회 | ✅ (담당만) | ✅ (본인만) |
| 알림 수신 | ✅ | ✅ |

---

## 4. 기능 구현 현황

### 완료된 기능 (프론트엔드)
- ✅ 로그인/회원가입 UI
- ✅ 온보딩 플로우 (ASRS + 설문 + 자기소개 + 코치선택)
- ✅ 코치/피코치 대시보드
- ✅ 세션 예약 모달
- ✅ 과제 관리 (CRUD UI)
- ✅ 메시지 UI (선언서/목표합의서 카드)
- ✅ 성찰 일지 UI
- ✅ 알림/리마인더 시스템
- ✅ 패키지 진행률 표시

### 백엔드 연동 필요
- ⬜ 사용자 인증 (Supabase Auth)
- ⬜ 세션 CRUD (sessions 테이블)
- ⬜ 과제 CRUD (tasks 테이블)
- ⬜ 메시지 CRUD (messages 테이블)
- ⬜ 설문/ASRS 결과 저장
- ⬜ 코치-피코치 매칭
- ⬜ 실시간 메시지/알림
- ⬜ 파일 업로드 (프로필 이미지 등)

---

## 5. 사용자 흐름

### 피코치 온보딩 흐름
```
회원가입 → 사전설문(5개 카테고리) → ASRS 자가진단(18문항)
    → 분석결과 확인 → 자기소개 작성 → 코치 선택 → 매칭완료
    → 대시보드 진입
```

### 코칭 진행 흐름
```
선언서 확인 → 목표합의서 동의 → 세션 진행 → 과제 수행
    → 성찰일지 작성 → 다음 세션 → ... → 사후설문 → 종료
```

### 세션 예약 흐름
```
예약 버튼 클릭 → 날짜/시간/회기번호/주제 선택
    → 예약 생성 → 세션 진행 → 일지 작성 → 완료
```

---

## 6. 데이터 엔티티 정의

### 6.1 User (사용자)
```typescript
interface User {
  id: string              // UUID
  email: string
  name: string
  role: 'coach' | 'coachee'
  phone?: string
  avatar_url?: string
  adhd_status?: 'diagnosed' | 'suspected' | 'unsure'
  created_at: timestamp
  updated_at: timestamp
}
```

### 6.2 Coach Profile (코치 프로필)
```typescript
interface CoachProfile {
  id: string              // user_id FK
  bio: string
  detail?: string
  specialties: string[]   // ['실행력 향상', '시간관리', ...]
  coaching_methods: string[]
  available_times: string
  max_coachees: number
  current_coachees: number
  created_at: timestamp
}
```

### 6.3 Coachee Profile (피코치 프로필)
```typescript
interface CoacheeProfile {
  id: string              // user_id FK
  coach_id: string        // 매칭된 코치
  package_type: 'starter' | 'basic' | 'premium'
  total_sessions: number
  completed_sessions: number
  current_session: number
  status: 'active' | 'paused' | 'completed'
  matched_at: timestamp
  created_at: timestamp
}
```

### 6.4 Self Introduction (자기소개)
```typescript
interface SelfIntroduction {
  id: string
  user_id: string
  intro: string           // 자기소개
  expectation: string     // 기대하는 점
  concern: string         // 걱정되는 점
  communication_styles: string[]  // ['think_time', 'praise', ...]
  preferred_times: string[]       // ['weekday_evening', ...]
  submitted_at: timestamp
}
```

### 6.5 ASRS Result (ASRS 결과)
```typescript
interface ASRSResult {
  id: string
  user_id: string
  total_score: number
  max_score: number
  inattention_score: number
  hyperactivity_score: number
  impulsivity_score: number
  level: 'low' | 'medium' | 'high'
  interpretation: string
  test_mode: 'quick' | 'full'
  answers: jsonb          // {1: 2, 2: 3, ...}
  completed_at: timestamp
}
```

### 6.6 Survey Result (설문 결과)
```typescript
interface SurveyResult {
  id: string
  user_id: string
  type: 'pre' | 'post'
  answers: jsonb          // {e1: 3, r1: 2, ...}
  category_scores: jsonb  // {execution: {name, average}, ...}
  total_score: number
  completed_at: timestamp

  // 사후설문 전용
  coaching_helpful?: number      // p1
  coach_trust?: number           // p2
  will_pay_again?: number        // p3
  will_recommend?: number        // p4
}
```

### 6.7 Coaching Goal (코칭 목표)
```typescript
interface CoachingGoal {
  id: string
  coachee_id: string
  title: string
  current_score: number
  target_score: number
  current_action: string
  created_at: timestamp
  updated_at: timestamp
}
```

### 6.8 Coaching Topic (코칭 주제)
```typescript
interface CoachingTopic {
  id: string
  coachee_id: string
  title: string
  description: string
  start_score: number
  current_score: number
  target_score: number
  order: number
  created_at: timestamp
}
```

### 6.9 Session (상담 세션)
```typescript
interface Session {
  id: string
  coach_id: string
  coachee_id: string
  date: date
  time: time
  duration: number        // 분
  type: 'message' | 'video'
  session_number: number
  topic: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_at: timestamp
  updated_at: timestamp
}
```

### 6.10 Session Note (세션 일지)
```typescript
interface SessionNote {
  id: string
  session_id: string
  coach_id: string
  coachee_id: string
  session_number: number

  // 목표 점검
  goal_progress: string
  current_score: number

  // 세션 내용
  main_topics: string[]
  key_insights: string
  coachee_feedback: string

  // 과제 설정
  new_tasks: jsonb        // [{title, description}, ...]

  // 다음 세션
  next_focus: string
  notes: string

  created_at: timestamp
  updated_at: timestamp
}
```

### 6.11 Task (과제)
```typescript
interface Task {
  id: string
  coachee_id: string
  session_number?: number

  // 기본 정보
  title: string
  description?: string
  due_date: date
  status: 'pending' | 'in_progress' | 'completed'

  // ADHD 실행 전략 필드
  purpose?: string         // 목적
  min_action?: string      // 가장 작은 행동
  location?: string        // 실행 장소
  signal?: string          // 실행 신호
  fallback?: string        // 축소 행동
  return_action?: string   // 복귀 행동

  // 반복 과제
  target_count?: number
  completed_count?: number

  details_completed: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

### 6.12 Execution Record (실행 기록)
```typescript
interface ExecutionRecord {
  id: string
  coachee_id: string
  task_id?: string
  date: date
  content: string
  completed: boolean
  created_at: timestamp
}
```

### 6.13 Reflection Note (성찰 일지)
```typescript
interface ReflectionNote {
  id: string
  coachee_id: string
  session_number: number
  date: date
  topic: string

  // 점수
  previous_score: number
  current_score: number

  // 성찰 내용
  learned: string         // 배운 점
  felt: string            // 느낀 점
  action_plan: string     // 실천 계획
  next_expectation: string // 다음 기대

  status: 'draft' | 'completed'
  created_at: timestamp
}
```

### 6.14 Conversation (대화)
```typescript
interface Conversation {
  id: string
  coach_id: string
  coachee_id: string
  created_at: timestamp
  updated_at: timestamp
}
```

### 6.15 Message (메시지)
```typescript
interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: 'coach' | 'coachee'
  content: string
  type: 'normal' | 'declaration' | 'goal_agreement' | 'task' | 'system'

  // 특수 메시지 데이터
  metadata?: jsonb        // 선언서/목표합의서 등 추가 데이터

  read: boolean
  created_at: timestamp
}
```

### 6.16 Notification (알림)
```typescript
interface Notification {
  id: string
  user_id: string
  type: 'task_reminder' | 'session_reminder' | 'message' | 'system'
  title: string
  message: string
  metadata?: jsonb
  read: boolean
  created_at: timestamp
}
```

### 6.17 Coaching Status (코칭 상태)
```typescript
interface CoachingStatus {
  id: string
  coachee_id: string
  declaration_completed: boolean
  goal_agreement_completed: boolean
  next_session_prepared: boolean
  updated_at: timestamp
}
```

---

## 7. 데이터베이스 스키마

### ERD 다이어그램 (텍스트)
```
┌─────────────┐       ┌─────────────────┐
│   users     │       │  coach_profiles │
├─────────────┤       ├─────────────────┤
│ id (PK)     │◄──────│ id (FK)         │
│ email       │       │ bio             │
│ name        │       │ specialties     │
│ role        │       │ max_coachees    │
│ phone       │       └─────────────────┘
│ avatar_url  │
│ created_at  │       ┌──────────────────┐
└──────┬──────┘       │ coachee_profiles │
       │              ├──────────────────┤
       │              │ id (FK)          │
       ├──────────────│ coach_id (FK)    │
       │              │ package_type     │
       │              │ total_sessions   │
       │              │ status           │
       │              └────────┬─────────┘
       │                       │
       │    ┌──────────────────┼───────────────────┐
       │    │                  │                   │
       ▼    ▼                  ▼                   ▼
┌───────────────┐    ┌─────────────────┐   ┌──────────────┐
│ asrs_results  │    │ survey_results  │   │   sessions   │
├───────────────┤    ├─────────────────┤   ├──────────────┤
│ id (PK)       │    │ id (PK)         │   │ id (PK)      │
│ user_id (FK)  │    │ user_id (FK)    │   │ coach_id     │
│ total_score   │    │ type            │   │ coachee_id   │
│ answers       │    │ answers         │   │ date, time   │
└───────────────┘    └─────────────────┘   │ status       │
                                           └──────┬───────┘
                                                  │
                     ┌────────────────────────────┼────────────┐
                     │                            │            │
                     ▼                            ▼            ▼
              ┌─────────────┐            ┌──────────────┐  ┌────────┐
              │session_notes│            │ reflections  │  │ tasks  │
              ├─────────────┤            ├──────────────┤  ├────────┤
              │ session_id  │            │ coachee_id   │  │ id     │
              │ coach_id    │            │ session_num  │  │coachee │
              │ key_insights│            │ learned      │  │ title  │
              └─────────────┘            └──────────────┘  │ status │
                                                           └────────┘

┌───────────────┐         ┌──────────────┐
│ conversations │         │  messages    │
├───────────────┤         ├──────────────┤
│ id (PK)       │◄────────│ conv_id (FK) │
│ coach_id      │         │ sender_id    │
│ coachee_id    │         │ content      │
└───────────────┘         │ type         │
                          └──────────────┘
```

---

## 8. PostgreSQL 마이그레이션

### 8.1 기본 테이블 생성

```sql
-- 001_create_users_extension.sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 002_create_users_table.sql
-- Users 테이블 (Supabase Auth와 연동)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coach', 'coachee')),
  phone TEXT,
  avatar_url TEXT,
  adhd_status TEXT CHECK (adhd_status IN ('diagnosed', 'suspected', 'unsure')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- 003_create_coach_profiles.sql
CREATE TABLE public.coach_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT NOT NULL DEFAULT '',
  detail TEXT,
  specialties TEXT[] DEFAULT '{}',
  coaching_methods TEXT[] DEFAULT '{}',
  available_times TEXT,
  max_coachees INTEGER DEFAULT 10,
  current_coachees INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 004_create_coachee_profiles.sql
CREATE TABLE public.coachee_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  package_type TEXT CHECK (package_type IN ('starter', 'basic', 'premium')),
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  current_session INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coachee_profiles_coach ON public.coachee_profiles(coach_id);
CREATE INDEX idx_coachee_profiles_status ON public.coachee_profiles(status);

-- 005_create_self_introductions.sql
CREATE TABLE public.self_introductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  intro TEXT NOT NULL,
  expectation TEXT NOT NULL,
  concern TEXT,
  communication_styles TEXT[] DEFAULT '{}',
  preferred_times TEXT[] DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- 006_create_asrs_results.sql
CREATE TABLE public.asrs_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  inattention_score INTEGER NOT NULL,
  hyperactivity_score INTEGER NOT NULL,
  impulsivity_score INTEGER NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('low', 'medium', 'high')),
  interpretation TEXT NOT NULL,
  test_mode TEXT DEFAULT 'full' CHECK (test_mode IN ('quick', 'full')),
  answers JSONB NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asrs_user ON public.asrs_results(user_id);

-- 007_create_survey_results.sql
CREATE TABLE public.survey_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pre', 'post')),
  answers JSONB NOT NULL,
  category_scores JSONB NOT NULL,
  total_score NUMERIC(3,2) NOT NULL,

  -- 사후설문 전용 필드
  coaching_helpful INTEGER CHECK (coaching_helpful BETWEEN 1 AND 5),
  coach_trust INTEGER CHECK (coach_trust BETWEEN 1 AND 5),
  will_pay_again INTEGER CHECK (will_pay_again BETWEEN 1 AND 5),
  will_recommend INTEGER CHECK (will_recommend BETWEEN 1 AND 5),

  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_user ON public.survey_results(user_id);
CREATE INDEX idx_survey_type ON public.survey_results(type);

-- 008_create_coaching_goals.sql
CREATE TABLE public.coaching_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coachee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  current_score INTEGER DEFAULT 0 CHECK (current_score BETWEEN 0 AND 10),
  target_score INTEGER DEFAULT 5 CHECK (target_score BETWEEN 0 AND 10),
  current_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_coachee ON public.coaching_goals(coachee_id);

-- 009_create_coaching_topics.sql
CREATE TABLE public.coaching_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coachee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_score INTEGER DEFAULT 0 CHECK (start_score BETWEEN 0 AND 10),
  current_score INTEGER DEFAULT 0 CHECK (current_score BETWEEN 0 AND 10),
  target_score INTEGER DEFAULT 5 CHECK (target_score BETWEEN 0 AND 10),
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_coachee ON public.coaching_topics(coachee_id);

-- 010_create_sessions.sql
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coachee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER DEFAULT 60,
  type TEXT DEFAULT 'message' CHECK (type IN ('message', 'video')),
  session_number INTEGER NOT NULL,
  topic TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_coach ON public.sessions(coach_id);
CREATE INDEX idx_sessions_coachee ON public.sessions(coachee_id);
CREATE INDEX idx_sessions_date ON public.sessions(date);
CREATE INDEX idx_sessions_status ON public.sessions(status);

-- 011_create_session_notes.sql
CREATE TABLE public.session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coachee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,

  -- 목표 점검
  goal_progress TEXT,
  current_score INTEGER CHECK (current_score BETWEEN 0 AND 10),

  -- 세션 내용
  main_topics TEXT[],
  key_insights TEXT,
  coachee_feedback TEXT,

  -- 과제 설정
  new_tasks JSONB,

  -- 다음 세션
  next_focus TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id)
);

CREATE INDEX idx_session_notes_coach ON public.session_notes(coach_id);
CREATE INDEX idx_session_notes_coachee ON public.session_notes(coachee_id);

-- 012_create_tasks.sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coachee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_number INTEGER,

  -- 기본 정보
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),

  -- ADHD 실행 전략 필드
  purpose TEXT,
  min_action TEXT,
  location TEXT,
  signal TEXT,
  fallback TEXT,
  return_action TEXT,

  -- 반복 과제
  target_count INTEGER,
  completed_count INTEGER DEFAULT 0,

  details_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_coachee ON public.tasks(coachee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due ON public.tasks(due_date);

-- 013_create_execution_records.sql
CREATE TABLE public.execution_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coachee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_execution_coachee ON public.execution_records(coachee_id);
CREATE INDEX idx_execution_date ON public.execution_records(date);

-- 014_create_reflection_notes.sql
CREATE TABLE public.reflection_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coachee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  topic TEXT,

  -- 점수
  previous_score INTEGER CHECK (previous_score BETWEEN 0 AND 10),
  current_score INTEGER CHECK (current_score BETWEEN 0 AND 10),

  -- 성찰 내용
  learned TEXT,
  felt TEXT,
  action_plan TEXT,
  next_expectation TEXT,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflection_coachee ON public.reflection_notes(coachee_id);

-- 015_create_conversations.sql
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coachee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(coach_id, coachee_id)
);

CREATE INDEX idx_conv_coach ON public.conversations(coach_id);
CREATE INDEX idx_conv_coachee ON public.conversations(coachee_id);

-- 016_create_messages.sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('coach', 'coachee')),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'normal' CHECK (type IN ('normal', 'declaration', 'goal_agreement', 'task', 'system')),
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conv ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- 017_create_notifications.sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_reminder', 'session_reminder', 'message', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- 018_create_coaching_status.sql
CREATE TABLE public.coaching_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coachee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  declaration_completed BOOLEAN DEFAULT FALSE,
  goal_agreement_completed BOOLEAN DEFAULT FALSE,
  next_session_prepared BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(coachee_id)
);

CREATE INDEX idx_coaching_status_coachee ON public.coaching_status(coachee_id);
```

### 8.2 트리거 및 함수

```sql
-- 019_create_triggers.sql

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블 트리거
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- coachee_profiles 테이블 트리거
CREATE TRIGGER update_coachee_profiles_updated_at
  BEFORE UPDATE ON public.coachee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- sessions 테이블 트리거
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- tasks 테이블 트리거
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 세션 완료 시 coachee_profiles.completed_sessions 증가
CREATE OR REPLACE FUNCTION increment_completed_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.coachee_profiles
    SET
      completed_sessions = completed_sessions + 1,
      current_session = current_session + 1
    WHERE id = NEW.coachee_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_session_complete
  AFTER UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION increment_completed_sessions();

-- 코치 매칭 시 current_coachees 증가
CREATE OR REPLACE FUNCTION update_coach_coachee_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로 매칭된 경우
  IF NEW.coach_id IS NOT NULL AND OLD.coach_id IS NULL THEN
    UPDATE public.coach_profiles
    SET current_coachees = current_coachees + 1
    WHERE id = NEW.coach_id;
  -- 매칭 해제된 경우
  ELSIF NEW.coach_id IS NULL AND OLD.coach_id IS NOT NULL THEN
    UPDATE public.coach_profiles
    SET current_coachees = current_coachees - 1
    WHERE id = OLD.coach_id;
  -- 코치가 변경된 경우
  ELSIF NEW.coach_id != OLD.coach_id THEN
    UPDATE public.coach_profiles
    SET current_coachees = current_coachees - 1
    WHERE id = OLD.coach_id;
    UPDATE public.coach_profiles
    SET current_coachees = current_coachees + 1
    WHERE id = NEW.coach_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_coachee_match_change
  AFTER UPDATE ON public.coachee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_coachee_count();

-- 새 사용자 생성 시 프로필 자동 생성
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'coach' THEN
    INSERT INTO public.coach_profiles (id)
    VALUES (NEW.id);
  ELSIF NEW.role = 'coachee' THEN
    INSERT INTO public.coachee_profiles (id)
    VALUES (NEW.id);

    INSERT INTO public.coaching_status (coachee_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- 코치-피코치 매칭 시 대화방 자동 생성
CREATE OR REPLACE FUNCTION create_conversation_on_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.coach_id IS NOT NULL AND OLD.coach_id IS NULL THEN
    INSERT INTO public.conversations (coach_id, coachee_id)
    VALUES (NEW.coach_id, NEW.id)
    ON CONFLICT (coach_id, coachee_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_coachee_matched
  AFTER UPDATE ON public.coachee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_on_match();
```

### 8.3 뷰

```sql
-- 020_create_views.sql

-- 코치 대시보드용 피코치 목록 뷰
CREATE OR REPLACE VIEW v_coach_coachees AS
SELECT
  u.id,
  u.name,
  u.email,
  u.phone,
  u.avatar_url,
  cp.package_type,
  cp.total_sessions,
  cp.completed_sessions,
  cp.current_session,
  cp.status,
  cp.matched_at,
  cp.coach_id,
  si.intro,
  si.expectation,
  si.communication_styles,
  si.preferred_times,
  ar.total_score as asrs_total,
  ar.level as asrs_level,
  cg.title as goal_title,
  cg.current_score as goal_current,
  cg.target_score as goal_target
FROM public.users u
JOIN public.coachee_profiles cp ON u.id = cp.id
LEFT JOIN public.self_introductions si ON u.id = si.user_id
LEFT JOIN public.asrs_results ar ON u.id = ar.user_id
LEFT JOIN public.coaching_goals cg ON u.id = cg.coachee_id
WHERE u.role = 'coachee';

-- 오늘의 세션 뷰
CREATE OR REPLACE VIEW v_today_sessions AS
SELECT
  s.*,
  coach.name as coach_name,
  coachee.name as coachee_name,
  cp.package_type
FROM public.sessions s
JOIN public.users coach ON s.coach_id = coach.id
JOIN public.users coachee ON s.coachee_id = coachee.id
LEFT JOIN public.coachee_profiles cp ON s.coachee_id = cp.id
WHERE s.date = CURRENT_DATE;

-- 피코치 진행 현황 뷰
CREATE OR REPLACE VIEW v_coachee_progress AS
SELECT
  cp.id as coachee_id,
  u.name,
  cp.package_type,
  cp.total_sessions,
  cp.completed_sessions,
  ROUND((cp.completed_sessions::NUMERIC / NULLIF(cp.total_sessions, 0)) * 100, 1) as progress_percent,
  cg.current_score,
  cg.target_score,
  cs.declaration_completed,
  cs.goal_agreement_completed,
  (SELECT COUNT(*) FROM public.tasks t WHERE t.coachee_id = cp.id AND t.status = 'pending') as pending_tasks,
  (SELECT COUNT(*) FROM public.tasks t WHERE t.coachee_id = cp.id AND t.status = 'completed') as completed_tasks
FROM public.coachee_profiles cp
JOIN public.users u ON cp.id = u.id
LEFT JOIN public.coaching_goals cg ON cp.id = cg.coachee_id
LEFT JOIN public.coaching_status cs ON cp.id = cs.coachee_id;
```

---

## 9. RLS 정책

```sql
-- 021_create_rls_policies.sql

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coachee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_introductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asrs_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_status ENABLE ROW LEVEL SECURITY;

-- =====================
-- USERS 정책
-- =====================
-- 본인 정보 조회
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- 코치는 담당 피코치 정보 조회 가능
CREATE POLICY "Coaches can view their coachees"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coachee_profiles cp
      WHERE cp.id = users.id AND cp.coach_id = auth.uid()
    )
  );

-- 본인 정보 수정
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- =====================
-- COACH_PROFILES 정책
-- =====================
CREATE POLICY "Anyone can view coach profiles"
  ON public.coach_profiles FOR SELECT
  USING (true);

CREATE POLICY "Coaches can update own profile"
  ON public.coach_profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================
-- COACHEE_PROFILES 정책
-- =====================
CREATE POLICY "Coachees can view own profile"
  ON public.coachee_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Coaches can view their coachees profiles"
  ON public.coachee_profiles FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coachees can update own profile"
  ON public.coachee_profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================
-- SELF_INTRODUCTIONS 정책
-- =====================
CREATE POLICY "Users can view own intro"
  ON public.self_introductions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view coachee intro"
  ON public.self_introductions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coachee_profiles cp
      WHERE cp.id = self_introductions.user_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own intro"
  ON public.self_introductions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intro"
  ON public.self_introductions FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================
-- ASRS_RESULTS 정책
-- =====================
CREATE POLICY "Users can view own asrs"
  ON public.asrs_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view coachee asrs"
  ON public.asrs_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coachee_profiles cp
      WHERE cp.id = asrs_results.user_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own asrs"
  ON public.asrs_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================
-- SURVEY_RESULTS 정책
-- =====================
CREATE POLICY "Users can view own survey"
  ON public.survey_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view coachee survey"
  ON public.survey_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coachee_profiles cp
      WHERE cp.id = survey_results.user_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own survey"
  ON public.survey_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================
-- SESSIONS 정책
-- =====================
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (coach_id = auth.uid() OR coachee_id = auth.uid());

CREATE POLICY "Coaches can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coachees can create sessions with their coach"
  ON public.sessions FOR INSERT
  WITH CHECK (
    coachee_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.coachee_profiles cp
      WHERE cp.id = auth.uid() AND cp.coach_id = sessions.coach_id
    )
  );

CREATE POLICY "Coaches can update their sessions"
  ON public.sessions FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coachees can cancel their sessions"
  ON public.sessions FOR UPDATE
  USING (coachee_id = auth.uid())
  WITH CHECK (status = 'cancelled');

-- =====================
-- SESSION_NOTES 정책
-- =====================
CREATE POLICY "Coaches can view own notes"
  ON public.session_notes FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coachees can view their session notes"
  ON public.session_notes FOR SELECT
  USING (coachee_id = auth.uid());

CREATE POLICY "Coaches can create notes"
  ON public.session_notes FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own notes"
  ON public.session_notes FOR UPDATE
  USING (coach_id = auth.uid());

-- =====================
-- TASKS 정책
-- =====================
CREATE POLICY "Coachees can view own tasks"
  ON public.tasks FOR SELECT
  USING (coachee_id = auth.uid());

CREATE POLICY "Coaches can view coachee tasks"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coachee_profiles cp
      WHERE cp.id = tasks.coachee_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create tasks for coachees"
  ON public.tasks FOR INSERT
  WITH CHECK (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.coachee_profiles cp
      WHERE cp.id = tasks.coachee_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.coachee_profiles cp
      WHERE cp.id = tasks.coachee_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coachees can update own task status"
  ON public.tasks FOR UPDATE
  USING (coachee_id = auth.uid())
  WITH CHECK (
    -- 피코치는 status, completed_count만 변경 가능
    coachee_id = auth.uid()
  );

-- =====================
-- MESSAGES 정책
-- =====================
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.coach_id = auth.uid() OR c.coachee_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.coach_id = auth.uid() OR c.coachee_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.coach_id = auth.uid() OR c.coachee_id = auth.uid())
    )
  )
  WITH CHECK (read = true);

-- =====================
-- NOTIFICATIONS 정책
-- =====================
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);  -- 서비스 역할로 삽입

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- =====================
-- COACHING_STATUS 정책
-- =====================
CREATE POLICY "Coachees can view own status"
  ON public.coaching_status FOR SELECT
  USING (coachee_id = auth.uid());

CREATE POLICY "Coaches can view coachee status"
  ON public.coaching_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coachee_profiles cp
      WHERE cp.id = coaching_status.coachee_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coachees can update own status"
  ON public.coaching_status FOR UPDATE
  USING (coachee_id = auth.uid());
```

---

## 10. Storage 설계

### 버킷 구조
```
storage/
├── avatars/           # 프로필 이미지
│   └── {user_id}/
│       └── avatar.{ext}
├── session-files/     # 세션 관련 파일
│   └── {session_id}/
│       └── {filename}
└── task-attachments/  # 과제 첨부파일
    └── {task_id}/
        └── {filename}
```

### Storage 정책

```sql
-- 022_create_storage_policies.sql

-- avatars 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- session-files 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-files', 'session-files', false);

-- task-attachments 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false);

-- Avatars 정책
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Session Files 정책
CREATE POLICY "Session participants can view files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'session-files' AND
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id::text = (storage.foldername(name))[1]
      AND (s.coach_id = auth.uid() OR s.coachee_id = auth.uid())
    )
  );

CREATE POLICY "Coaches can upload session files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'session-files' AND
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id::text = (storage.foldername(name))[1]
      AND s.coach_id = auth.uid()
    )
  );

-- Task Attachments 정책
CREATE POLICY "Task owner can view attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-attachments' AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[1]
      AND (t.coachee_id = auth.uid() OR
           EXISTS (
             SELECT 1 FROM public.coachee_profiles cp
             WHERE cp.id = t.coachee_id AND cp.coach_id = auth.uid()
           ))
    )
  );

CREATE POLICY "Coachees can upload task attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments' AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[1]
      AND t.coachee_id = auth.uid()
    )
  );
```

---

## 11. Realtime 설계

### 구독 채널

| 채널 | 대상 | 용도 |
|------|------|------|
| `messages:{conversation_id}` | 대화 참여자 | 실시간 메시지 |
| `notifications:{user_id}` | 해당 사용자 | 알림 수신 |
| `sessions:{coach_id}` | 코치 | 세션 상태 변경 |
| `tasks:{coachee_id}` | 피코치 | 과제 업데이트 |

### Realtime 활성화

```sql
-- 023_enable_realtime.sql

-- 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
```

### 프론트엔드 구독 예시

```javascript
// 메시지 실시간 구독
const subscribeToMessages = (conversationId, callback) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      callback
    )
    .subscribe()
}

// 알림 실시간 구독
const subscribeToNotifications = (userId, callback) => {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}
```

---

## 12. 프론트엔드 연동 계획

### 12.1 Supabase 클라이언트 설정

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const isSupabaseConfigured = () => !!supabaseUrl && !!supabaseAnonKey
```

### 12.2 인증 서비스

```javascript
// src/lib/authService.js
import { supabase } from './supabase'

export async function signUp(email, password, userData) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError

  // users 테이블에 추가 정보 저장
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      adhd_status: userData.adhdStatus,
    })

  if (profileError) throw profileError

  return authData
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // 사용자 정보 조회
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()

  return { ...data, profile: user }
}

export async function signOut() {
  return supabase.auth.signOut()
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}
```

### 12.3 세션 서비스 (업데이트)

```javascript
// src/lib/sessionService.js
import { supabase, isSupabaseConfigured } from './supabase'

export async function createSession(sessionData) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCoachSessions(coachId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      coachee:coachee_id(id, name, avatar_url)
    `)
    .eq('coach_id', coachId)
    .order('date', { ascending: true })

  if (error) throw error
  return data
}

export async function getCoacheeSessions(coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      coach:coach_id(id, name, avatar_url)
    `)
    .eq('coachee_id', coacheeId)
    .order('date', { ascending: true })

  if (error) throw error
  return data
}

export async function updateSession(sessionId, updateData) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export function subscribeToSessions(userId, role, callback) {
  if (!isSupabaseConfigured()) return () => {}

  const filterColumn = role === 'coach' ? 'coach_id' : 'coachee_id'

  return supabase
    .channel(`sessions:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `${filterColumn}=eq.${userId}`
      },
      callback
    )
    .subscribe()
}
```

### 12.4 과제 서비스

```javascript
// src/lib/taskService.js
import { supabase, isSupabaseConfigured } from './supabase'

export async function createTask(taskData) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCoacheeTasks(coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('coachee_id', coacheeId)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data
}

export async function updateTask(taskId, updateData) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function sendTaskReminder(coacheeId, taskTitle, message) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: coacheeId,
      type: 'task_reminder',
      title: '과제 리마인더',
      message: message || `"${taskTitle}" 과제를 확인해주세요!`,
      metadata: { task_title: taskTitle }
    })

  if (error) throw error
  return data
}
```

### 12.5 메시지 서비스

```javascript
// src/lib/messageService.js
import { supabase, isSupabaseConfigured } from './supabase'

export async function getOrCreateConversation(coachId, coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 기존 대화방 찾기
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('coach_id', coachId)
    .eq('coachee_id', coacheeId)
    .single()

  if (existing) return existing

  // 새 대화방 생성
  const { data, error } = await supabase
    .from('conversations')
    .insert({ coach_id: coachId, coachee_id: coacheeId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMessages(conversationId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id(id, name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function sendMessage(conversationId, senderId, senderRole, content, type = 'normal', metadata = null) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      sender_role: senderRole,
      content,
      type,
      metadata
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export function subscribeToMessages(conversationId, callback) {
  if (!isSupabaseConfigured()) return () => {}

  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}
```

### 12.6 Zustand Store 연동

```javascript
// src/store/useStore.js (수정 사항)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useStore = create(
  persist(
    (set, get) => ({
      // 기존 상태...

      // Supabase 인증 상태 동기화
      initAuth: async () => {
        if (!isSupabaseConfigured()) return

        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          set({ user: profile })
        }

        // 인증 상태 변경 리스너
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            set({ user: profile })
          } else if (event === 'SIGNED_OUT') {
            get().resetAll()
          }
        })
      },

      // 세션 실시간 동기화
      syncSessions: async () => {
        if (!isSupabaseConfigured()) return () => {}

        const { user } = get()
        if (!user) return () => {}

        const filterColumn = user.role === 'coach' ? 'coach_id' : 'coachee_id'

        // 초기 데이터 로드
        const { data } = await supabase
          .from('sessions')
          .select('*')
          .eq(filterColumn, user.id)

        if (data) set({ sessions: data })

        // 실시간 구독
        const subscription = supabase
          .channel(`sessions:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'sessions',
              filter: `${filterColumn}=eq.${user.id}`
            },
            (payload) => {
              const { sessions } = get()

              if (payload.eventType === 'INSERT') {
                set({ sessions: [...sessions, payload.new] })
              } else if (payload.eventType === 'UPDATE') {
                set({
                  sessions: sessions.map(s =>
                    s.id === payload.new.id ? payload.new : s
                  )
                })
              } else if (payload.eventType === 'DELETE') {
                set({
                  sessions: sessions.filter(s => s.id !== payload.old.id)
                })
              }
            }
          )
          .subscribe()

        return () => subscription.unsubscribe()
      },

      // 알림 실시간 동기화
      syncNotifications: async () => {
        if (!isSupabaseConfigured()) return () => {}

        const { user } = get()
        if (!user) return () => {}

        // 초기 데이터 로드
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (data) set({ notifications: data })

        // 실시간 구독
        const subscription = supabase
          .channel(`notifications:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              const { notifications } = get()
              set({ notifications: [payload.new, ...notifications] })
            }
          )
          .subscribe()

        return () => subscription.unsubscribe()
      },
    }),
    {
      name: 'floca-storage',
      // ...기존 partialize 설정
    }
  )
)
```

### 12.7 환경 변수

```env
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 부록: 체크리스트

### 배포 전 확인사항

- [ ] Supabase 프로젝트 생성
- [ ] 모든 마이그레이션 실행
- [ ] RLS 정책 테스트
- [ ] Storage 버킷 및 정책 설정
- [ ] Realtime 활성화 확인
- [ ] 환경 변수 설정
- [ ] 인증 플로우 테스트
- [ ] 역할별 권한 테스트
- [ ] 실시간 구독 테스트

### 향후 확장 고려사항

1. **Edge Functions**: 복잡한 비즈니스 로직 처리
2. **Database Functions**: 트랜잭션이 필요한 작업
3. **Webhooks**: 외부 서비스 연동 (이메일, SMS)
4. **Analytics**: 사용자 행동 분석
5. **Backup**: 정기 백업 설정

---

*이 문서는 FLOCA 코칭 상담 프로그램의 Supabase 백엔드 설계를 위해 작성되었습니다.*
*작성일: 2026-07-27*
