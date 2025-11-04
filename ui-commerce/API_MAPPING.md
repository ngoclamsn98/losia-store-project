# API Mapping - UI Commerce với Backend

## 1. Authentication Flow

### 1.1 Register (Đăng ký)

#### Frontend (ui-commerce)
**File**: `ui-commerce/src/app/(public)/register/page.tsx`

**Form Data**:
```typescript
{
  name: string,          // Họ và tên đầy đủ
  email: string,         // Email
  phone: string,         // Số điện thoại
  password: string,      // Mật khẩu
  confirmPassword: string // Xác nhận mật khẩu (chỉ dùng validation frontend)
}
```

**API Call**: `POST /api/auth/register`

---

#### API Route (Next.js)
**File**: `ui-commerce/src/app/api/auth/register/route.ts`

**Mapping**:
```typescript
// Frontend → Backend
{
  name: "Nguyễn Văn A"     → firstName: "Nguyễn", lastName: "Văn A"
  email: "user@email.com"  → email: "user@email.com"
  phone: "0912345678"      → phone: "0912345678"
  password: "123456"       → password: "123456"
}
```

**Backend Call**: `POST http://localhost:3001/auth/register`

---

#### Backend (NestJS)
**File**: `backend/src/auth/auth.controller.ts`

**Endpoint**: `POST /auth/register`

**DTO** (`backend/src/auth/dto/register.dto.ts`):
```typescript
{
  email: string,          // Required
  password: string,       // Required, min 6 chars
  firstName?: string,     // Optional
  lastName?: string,      // Optional
  phone?: string,         // Optional
  gender?: 'MALE' | 'FEMALE' | 'OTHER', // Optional
  address?: string        // Optional
}
```

**Response**:
```typescript
{
  accessToken: string,
  user: {
    id: string,
    email: string,
    firstName: string | null,
    lastName: string | null,
    phone: string | null,
    gender: string | null,
    address: string | null,
    role: 'USER' | 'STAFF' | 'ADMIN' | 'SUPERADMIN',
    level: number
  }
}
```

---

### 1.2 Login (Đăng nhập)

#### Frontend (ui-commerce)
**File**: `ui-commerce/src/app/(public)/login/page.tsx`

**Form Data**:
```typescript
{
  email: string,
  password: string
}
```

**Authentication**: Sử dụng NextAuth.js

---

#### NextAuth Configuration
**File**: `ui-commerce/src/auth.ts`

**Provider**: Credentials

**Verify Function**: 
- Gọi `POST http://localhost:3001/auth/login`
- Nhận response từ backend
- Map data sang NextAuth User object

**Mapping**:
```typescript
// Backend Response → NextAuth User
{
  accessToken: "jwt_token",
  user: {
    id: "uuid",
    email: "user@email.com",
    firstName: "Nguyễn",
    lastName: "Văn A",
    ...
  }
}
→
{
  id: "uuid",
  email: "user@email.com",
  name: "Nguyễn Văn A",  // firstName + lastName
  image: null,
  accessToken: "jwt_token"
}
```

---

#### Backend (NestJS)
**File**: `backend/src/auth/auth.controller.ts`

**Endpoint**: `POST /auth/login`

**DTO** (`backend/src/auth/dto/login.dto.ts`):
```typescript
{
  email: string,      // Required
  password: string    // Required, min 6 chars
}
```

**Response**:
```typescript
{
  accessToken: string,
  user: {
    id: string,
    email: string,
    firstName: string | null,
    lastName: string | null,
    phone: string | null,
    gender: string | null,
    address: string | null,
    role: 'USER' | 'STAFF' | 'ADMIN' | 'SUPERADMIN',
    level: number
  }
}
```

---

## 2. Environment Variables

### Frontend (ui-commerce)
**File**: `ui-commerce/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Backend (NestJS)
**File**: `backend/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/losia_db
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
PORT=3001
```

---

## 3. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTER FLOW                             │
└─────────────────────────────────────────────────────────────┘

Frontend Form (register/page.tsx)
  ↓ { name, email, phone, password }
  
Next.js API Route (/api/auth/register/route.ts)
  ↓ Split name → { firstName, lastName, email, phone, password }
  
Backend API (POST /auth/register)
  ↓ Validate DTO, Hash password, Save to DB
  
Response: { accessToken, user: {...} }
  ↑
  
Frontend: Redirect to /login?registered=true


┌─────────────────────────────────────────────────────────────┐
│                     LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────┘

Frontend Form (login/page.tsx)
  ↓ { email, password }
  
NextAuth signIn("credentials", { email, password })
  ↓
  
auth.ts → verifyUser()
  ↓ POST /auth/login to Backend
  
Backend API (POST /auth/login)
  ↓ Validate credentials, Generate JWT
  
Response: { accessToken, user: {...} }
  ↑
  
NextAuth: Map to User object, Create session
  ↑
  
Frontend: Redirect to callbackUrl or "/"
```

---

## 4. Key Files Summary

### Frontend (ui-commerce)
| File | Purpose |
|------|---------|
| `src/app/(public)/register/page.tsx` | Register form UI |
| `src/app/(public)/login/page.tsx` | Login form UI |
| `src/app/api/auth/register/route.ts` | Register API proxy |
| `src/auth.ts` | NextAuth configuration |

### Backend (NestJS)
| File | Purpose |
|------|---------|
| `src/auth/auth.controller.ts` | Auth endpoints |
| `src/auth/auth.service.ts` | Auth business logic |
| `src/auth/dto/register.dto.ts` | Register validation |
| `src/auth/dto/login.dto.ts` | Login validation |

---

## 5. Testing

### Register
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "firstName": "Test",
    "lastName": "User",
    "phone": "0912345678"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

