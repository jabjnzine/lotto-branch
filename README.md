# ระบบหลังบ้านหวย (Thai/Lao Lottery Back Office)

ระบบจัดการหวยไทยและลาว — monorepo ด้วย pnpm workspaces

## โครงสร้างโปรเจค

```
project/
├── apps/
│   ├── web/          ← Next.js 15 Back Office (port 3000)
│   └── api/          ← NestJS Backend (port 3001)
├── packages/
│   └── shared/       ← Shared Types + DTOs + Lottery Utils
└── package.json      ← pnpm workspace root
```

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Form | React Hook Form + Zod |
| Data Fetching | TanStack Query |
| Backend | NestJS + TypeScript |
| Database | Supabase (PostgreSQL) |
| ORM | TypeORM |
| Auth | JWT (Access Token + Refresh Token) |

## เริ่มต้นใช้งาน

### Requirements
- Node.js >= 22
- pnpm >= 10
- Supabase project
- PostgreSQL database

### Installation

```bash
pnpm install
```

### Environment Setup

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# แก้ไขค่าใน .env ให้ครบ

# Frontend
cp apps/web/.env.local.example apps/web/.env.local
# แก้ไข NEXT_PUBLIC_API_URL
```

### Database Migration

```bash
# สร้าง migration
pnpm --filter api typeorm migration:generate src/migrations/Init

# รัน migration
pnpm --filter api typeorm migration:run
```

### Run Development

```bash
pnpm dev
# หรือแยกแต่ละ app
pnpm --filter web dev   # → http://localhost:3000
pnpm --filter api dev   # → http://localhost:3001
```

## หน้าต่างๆ

| หน้า | URL |
|---|---|
| Login | `/login` |
| Dashboard | `/dashboard` |
| คีย์หวย | `/bet` |
| เลขอั้น | `/restrictions` |
| ผลหวย | `/results` |
| รายได้ | `/income` |
| รายงาน | `/reports` |
| บ้าน | `/houses` |
| ตั้งค่า | `/settings` |

## ประเภทหวยที่รองรับ

- หวยรัฐบาลไทย (TH) — 1 และ 16 ของทุกเดือน
- หวยลาวพัฒนา (LAO_PATTHANA) — จันทร์-ศุกร์
- หวยลาวซุปเปอร์ (LAO_SUPER) — ทุกวัน
- หวยลาวสตาร์/HD (LAO_STAR) — ทุกวัน
