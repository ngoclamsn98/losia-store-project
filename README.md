# Losia Store Project

Dự án Full Stack với NestJS Backend và Next.js Frontend sử dụng Tailwind CSS + shadcn/ui.

## 🏗️ Cấu trúc dự án

```
losia-store-project/
├── backend/          # NestJS Backend API (Port 3001)
├── frontend/         # Next.js Frontend (Port 3000)
├── package.json      # Root package.json với scripts để chạy cả 2 dự án
└── README.md
```

## 🚀 Công nghệ sử dụng

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **Port**: 3001

### Frontend
- **Next.js 16** - React framework với App Router
- **React 19** - Latest React version
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Re-usable components built with Radix UI and Tailwind CSS
- **Port**: 3000

## 📦 Cài đặt

### Cài đặt tất cả dependencies

```bash
npm run install:all
```

Hoặc cài đặt từng phần:

```bash
# Cài đặt root dependencies
npm install

# Cài đặt backend dependencies
cd backend && npm install

# Cài đặt frontend dependencies
cd frontend && npm install
```

## 🎯 Chạy dự án

### Chạy cả Backend và Frontend cùng lúc (Development mode)

```bash
npm run dev
```

Lệnh này sẽ chạy:
- Backend tại: http://localhost:3001
- Frontend tại: http://localhost:3000

### Chạy riêng từng phần

```bash
# Chỉ chạy Backend
npm run dev:backend

# Chỉ chạy Frontend
npm run dev:frontend
```

## 🏭 Production

### Build cả 2 dự án

```bash
npm run build
```

### Chạy production mode

```bash
npm run start
```

## 📝 Scripts có sẵn

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy cả backend và frontend ở development mode |
| `npm run dev:backend` | Chỉ chạy backend ở development mode |
| `npm run dev:frontend` | Chỉ chạy frontend ở development mode |
| `npm run start` | Chạy cả backend và frontend ở production mode |
| `npm run build` | Build cả backend và frontend |
| `npm run install:all` | Cài đặt dependencies cho tất cả projects |

## 🔧 Cấu hình

### Backend (NestJS)
- Port mặc định: **3001**
- CORS đã được enable cho frontend (http://localhost:3000)
- File cấu hình chính: `backend/src/main.ts`

### Frontend (Next.js)
- Port mặc định: **3000**
- Tailwind CSS v4 đã được cấu hình
- shadcn/ui components có thể được thêm vào
- File cấu hình: `frontend/next.config.ts`

## 🎨 Sử dụng shadcn/ui

Để thêm components từ shadcn/ui:

```bash
cd frontend
npx shadcn@latest add button
npx shadcn@latest add card
# ... thêm các components khác
```

## 📚 Tài liệu tham khảo

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## 🤝 Đóng góp

Dự án này được tạo ra để phát triển Losia Store.

## 📄 License

ISC

