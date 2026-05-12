# Tech Stack — ระบบหลังบ้านหวย (ไทย / ลาว)

---

## สถานะโปรเจค (อัปเดตล่าสุด: 13 พ.ค. 2569)

### ✅ Backend (apps/api) — เสร็จแล้ว

| Module | สถานะ | หมายเหตุ |
|---|---|---|
| Project structure | ✅ | monorepo pnpm workspace |
| Entities | ✅ | User, House, LotteryType, PrizeRate, LotteryRound, LotteryResult, Restriction, Bet, BetItem, AuditLog |
| Migration | ✅ | `1700000000000-InitSchema.ts` — สร้างตารางทั้งหมด + seed ข้อมูล |
| Auth module | ✅ | login, refresh, logout, /me — JWT Access+Refresh Token |
| LotteryTypes module | ✅ | GET list, GET by id, PATCH |
| PrizeRates module | ✅ | GET by lottery type, PATCH |
| Rounds module | ✅ | GET list, GET current, POST, PATCH status, PATCH cancel, GET result, POST result |
| Bets module | ✅ | GET list, GET by id, POST, DELETE (soft) |
| Restrictions module | ✅ | GET by round, POST, DELETE (soft) |
| Income module | ✅ | GET summary by roundId / by date range |

### ⚙️ การแก้ไขที่สำคัญ (session นี้)

| รายการ | รายละเอียด |
|---|---|
| `bcrypt` → `bcryptjs` | เปลี่ยนเพราะ native binding หาไม่เจอบน Windows |
| dotenv โหลดไม่ขึ้น | เพิ่ม `-r dotenv/config` ใน ts-node-dev dev script |
| TypeORM ใช้ `DIRECT_URL` | เปลี่ยนจาก pgbouncer (port 6543) → direct connection (port 5432) เพราะ TypeORM ต้องการ persistent connection |
| LoginDto ขาด decorator | เพิ่ม `@IsEmail()` และ `@IsString()` เพื่อให้ ValidationPipe ผ่าน |

### 🔑 Admin Account (seed)

| | |
|---|---|
| Email | `admin@example.com` |
| Password | `password` (hash ใน migration เป็น hash ของคำว่า `password`) |

> ถ้าต้องการเปลี่ยนเป็น `admin1234` รัน SQL นี้ใน Supabase:
> ```sql
> UPDATE users SET password = '$2b$10$KD0RmnJIPBNcvVn2oY60j.3c9eK6FvsN486UeEplG0MFYf9nhhGKy' WHERE email = 'admin@example.com';
> ```

### 🔲 Frontend (apps/web) — ยังไม่ได้เริ่ม

| หน้า | สถานะ |
|---|---|
| Login `/login` | ⬜ |
| Dashboard `/dashboard` | ⬜ |
| คีย์หวย `/bet` | ⬜ |
| เลขอั้น `/restrictions` | ⬜ |
| ผลหวย `/results` | ⬜ |
| รายได้ `/income` | ⬜ |
| รายงาน `/reports` | ⬜ |
| บ้าน `/houses` | ⬜ |
| ตั้งค่า `/settings` | ⬜ |

### ▶️ วิธีรัน (ปัจจุบัน)

```bash
# รัน API เท่านั้น (Backend พร้อมใช้งาน)
pnpm --filter api dev   # → http://localhost:3001

# รัน migration (ครั้งแรกหรือหลังแก้ schema)
pnpm --filter api migration:run
```

### 📋 ขั้นตอนต่อไป (Next Steps)

1. **เริ่ม Frontend** — setup Next.js + shadcn/ui + Zustand + TanStack Query
2. **หน้า Login** — form + เชื่อม `/auth/login` + เก็บ token ใน Zustand
3. **Layout หลัก** — sidebar (desktop) + bottom nav (mobile)
4. **หน้า Dashboard** — สรุปยอดงวดล่าสุด
5. **หน้าคีย์หวย** — feature หลักของระบบ

---

## Overview

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand |
| Form | React Hook Form + Zod |
| Backend | NestJS + TypeScript |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| ORM | TypeORM |
| Auth | JWT (Access Token + Refresh Token) |

---

## วิธีใช้ไฟล์นี้กับ Claude

> ไฟล์นี้คือ single source of truth ของโปรเจค — อัปเดตทุกครั้งที่มีการเปลี่ยนแปลง

### Workflow

1. คุยกับ Claude → ตัดสินใจเรื่องใดก็ตาม → Claude อัปเดตไฟล์นี้ทันที
2. เริ่ม session ใหม่ → **แนบไฟล์นี้มาด้วยทุกครั้ง**
3. บอก Claude ว่า "นี่คือ spec ของโปรเจค ช่วยเขียน [module] ให้หน่อย"

### สิ่งที่ Claude ช่วยได้

- เขียน code ทีละ module (entity, service, controller, hook, component)
- เขียน migration files
- ทำ UI component ทีละหน้า
- Debug และ review code

### ข้อควรรู้

- ทำทีละ module — ไม่ทำทั้งโปรเจคในครั้งเดียว
- เอา code ไป run → เจอ error → เอามาถามต่อได้เลย
- Claude อัปเดตไฟล์นี้ทุกครั้งที่มีการตัดสินใจใหม่ ไม่ต้องเตือน

---



```
project/
├── apps/
│   ├── web/       ← Next.js Back Office (port 3000)
│   └── api/       ← NestJS Backend (port 3001)
├── packages/
│   └── shared/    ← Shared Types + DTOs + Lottery Utils
└── package.json   ← pnpm workspace root
```

---

## Frontend (`apps/web`)

> รองรับทั้ง Desktop และ Mobile — ใช้ Mobile First

### Dependencies

```bash
pnpm add next react react-dom typescript
pnpm add tailwindcss @tailwindcss/vite
pnpm add zustand
pnpm add react-hook-form zod @hookform/resolvers
pnpm add dayjs
```

### shadcn/ui Setup

```bash
pnpx shadcn@latest init
```

### Tailwind v4 Config

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #your-brand-color;
  --color-secondary: #your-secondary-color;
  --font-sans: "Noto Sans Thai", sans-serif;
  --radius: 0.5rem;
}
```

### Responsive Breakpoints

| Breakpoint | ขนาด | Layout หลัก |
|---|---|---|
| (default) | < 768px | Mobile — stack vertical, bottom nav |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop — sidebar + content |

### หลักการ Mobile

- **Mobile First** — เขียน style จาก mobile ขึ้นไป
- **Bottom Navigation** บน mobile แทน sidebar
- **Touch target** ขั้นต่ำ 44×44px — สำคัญมากสำหรับหน้าคีย์เลข
- **Numeric keyboard** — ใช้ `inputMode="numeric"` บน input เลข

---

## Backend (`apps/api`)

### Dependencies

```bash
pnpm add @nestjs/core @nestjs/common @nestjs/platform-express
pnpm add @nestjs/typeorm typeorm pg
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add @supabase/supabase-js
pnpm add @nestjs/schedule
pnpm add @nestjs/bull bullmq ioredis
pnpm add axios
pnpm add decimal.js
pnpm add bcrypt class-validator class-transformer
```

### Environment Variables

```env
# apps/api/.env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
JWT_ACCESS_SECRET=xxx
JWT_REFRESH_SECRET=xxx
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
```

```env
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Getting Started

### Requirements

- Node.js >= 22
- pnpm >= 10
- Supabase account + project
- Redis (สำหรับ BullMQ)

### Installation

```bash
pnpm install
pnpm dev

pnpm --filter web dev   # → http://localhost:3000
pnpm --filter api dev   # → http://localhost:3001
```

---

## Frontend Conventions

### Form Components — ใช้ React Hook Form หุ้มเสมอ

> ไม่เขียน `register`, `control`, `errors` กระจายในหน้า — ห่อเป็น component ไว้ใช้ซ้ำ

```
apps/web/components/
└── form/
    ├── FormInput.tsx        ← input ธรรมดา
    ├── FormNumericInput.tsx ← input ตัวเลข (inputMode="numeric")
    ├── FormSelect.tsx       ← dropdown
    ├── FormDatePicker.tsx   ← วันที่
    └── FormTextarea.tsx     ← textarea
```

```tsx
// components/form/FormInput.tsx
import { useFormContext } from 'react-hook-form'

interface Props {
  name: string
  label: string
  placeholder?: string
  disabled?: boolean
}

export function FormInput({ name, label, placeholder, disabled }: Props) {
  const { register, formState: { errors } } = useFormContext()

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        {...register(name)}
        placeholder={placeholder}
        disabled={disabled}
        className="border rounded px-3 py-2 text-sm"
      />
      {errors[name] && (
        <span className="text-xs text-red-500">
          {errors[name]?.message as string}
        </span>
      )}
    </div>
  )
}
```

```tsx
// components/form/FormNumericInput.tsx — สำหรับหน้าคีย์หวยโดยเฉพาะ
export function FormNumericInput({ name, label, maxLength }: Props) {
  const { register, formState: { errors } } = useFormContext()

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        {...register(name)}
        inputMode="numeric"
        pattern="\d*"
        maxLength={maxLength}
        className="border rounded px-3 py-2 text-sm"
      />
      {errors[name] && (
        <span className="text-xs text-red-500">
          {errors[name]?.message as string}
        </span>
      )}
    </div>
  )
}
```

```tsx
// การใช้งานในหน้า — ใช้ FormProvider หุ้ม
const methods = useForm<BetFormValues>({ resolver: zodResolver(betSchema) })

<FormProvider {...methods}>
  <form onSubmit={methods.handleSubmit(onSubmit)}>
    <FormNumericInput name="number" label="เลข" maxLength={3} />
    <FormNumericInput name="amount" label="ยอด" />
  </form>
</FormProvider>
```

---

### Hook vs Store — แยกหน้าที่ชัดเจน

| | Hook (`lib/hooks/`) | Store (`lib/stores/`) |
|---|---|---|
| **ทำอะไร** | fetch ข้อมูล, mutation, side effect | global state ที่ใช้ข้ามหน้า |
| **ตัวอย่าง** | `useBets`, `useRounds`, `useResults` | `useAuthStore`, `useBetStore` |
| **เก็บอะไร** | — | auth user, draft bet, active round |
| **reset เมื่อไหร่** | unmount | logout / เปลี่ยนงวด |

```ts
// ✅ Hook — ดึงข้อมูล + mutation
// lib/hooks/useBets.ts
export function useBets(roundId: string) {
  return useQuery({
    queryKey: ['bets', roundId],
    queryFn: () => api.get(`/bets?roundId=${roundId}`),
  })
}

export function useCreateBet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateBetDto) => api.post('/bets', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bets'] }),
  })
}
```

```ts
// ✅ Store — global state ข้ามหน้า
// lib/stores/useBetStore.ts
interface BetStore {
  draftItems: BetItem[]        // รายการที่กำลังคีย์อยู่
  activeRoundId: string | null
  addItem: (item: BetItem) => void
  clearItems: () => void
  setRound: (roundId: string) => void
}

export const useBetStore = create<BetStore>((set) => ({
  draftItems: [],
  activeRoundId: null,
  addItem: (item) => set((s) => ({ draftItems: [...s.draftItems, item] })),
  clearItems: () => set({ draftItems: [] }),
  setRound: (roundId) => set({ activeRoundId: roundId }),
}))
```

```ts
// ✅ Auth Store
// lib/stores/useAuthStore.ts
interface AuthStore {
  accessToken: string | null
  user: { id: string; name: string; role: UserRole } | null
  setAuth: (token: string, user: AuthStore['user']) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}))
```

---

### Component Structure — เพิ่ม feature ใหม่ทำเป็น component ไว้เสมอ

```
apps/web/
├── app/                        ← Next.js pages (routing เท่านั้น)
│   ├── bet/page.tsx
│   ├── results/page.tsx
│   └── ...
├── components/
│   ├── form/                   ← Form components (ด้านบน)
│   ├── ui/                     ← shadcn/ui (auto-generated)
│   ├── bet/                    ← feature components
│   │   ├── BetTable.tsx
│   │   ├── BetItemRow.tsx
│   │   └── BetSummary.tsx
│   ├── results/
│   │   ├── ResultCard.tsx
│   │   └── ResultBadge.tsx
│   ├── restrictions/
│   │   └── RestrictionList.tsx
│   └── shared/                 ← ใช้ได้ทุกหน้า
│       ├── Countdown.tsx
│       ├── PageHeader.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── hooks/                  ← data fetching hooks
│   └── stores/                 ← zustand stores
```

> **กฎ:** ถ้า JSX ยาวกว่า 80 บรรทัด หรือใช้ซ้ำได้ → แยกเป็น component ใหม่ทันที

---



### Custom Hooks + Zustand Store

```
lib/
├── stores/
│   ├── useAuthStore.ts
│   ├── useBetStore.ts
│   └── useResultStore.ts
└── hooks/
    ├── useBets.ts
    ├── useResults.ts
    ├── useRestrictions.ts
    └── useReport.ts
```

### Pagination (Offset-based)

```
GET /bets?page=1&pageSize=20&roundId=xxx
```

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

---

## Domain — Lottery Utils (`packages/shared`)

Logic เลขหวยทั้งหมดรวมไว้ที่นี่ ใช้ได้ทั้ง frontend และ backend

```ts
permute(num: string): string[]           // 123 → [132, 213, 231, 312, 321]
rude(digit: string, pos): string[]       // รูดบน 5 → [50,51,...,59]
nineteenGates(digit: string): string[]   // 19ประตู
checkPrize(result, bets): PayoutSummary  // ตรวจรางวัล + คำนวณจ่าย
```

### การเงิน — ใช้ decimal.js เสมอ

```ts
import Decimal from 'decimal.js'
const pay = new Decimal(amount).mul(rate) // ห้ามใช้ float คูณเงิน
```

### วันที่ — พ.ศ.

```ts
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
dayjs.extend(buddhistEra)
dayjs.locale('th')
dayjs().format('D MMMM BBBB') // → "16 พฤษภาคม 2569"
```

---

## Feature List

### 🎯 การรับแทง (Bet Entry)

| Feature | Desktop | Mobile | หมายเหตุ |
|---|:---:|:---:|---|
| คีย์เลขทีละบิล | ✅ | ✅ | หน้าหลักของระบบ |
| แทงเร็ว (กดต่อเนื่อง) | ✅ | ✅ | ไม่ต้อง confirm ทุกครั้ง |
| กลับเลข / 6กลับ | ✅ | ✅ | generate permutation อัตโนมัติ |
| รูด บน/ล่าง | ✅ | ✅ | |
| 19ประตู | ✅ | ✅ | |
| 2ตัว / 3ตัว / วิ่ง | ✅ | ✅ | |
| ใส่เลขบิล/ตอง | ✅ | ✅ | |
| ตั้งราคา บน/ล่าง แยกต่อบิล | ✅ | ✅ | |
| ล้างตาราง / ยกเลิกบิล | ✅ | ✅ | |
| Countdown ปิดรับ | ✅ | ✅ | real-time |

### 🚫 เลขอั้น / วงเงิน

| Feature | Desktop | Mobile | หมายเหตุ |
|---|:---:|:---:|---|
| ปิดรับ (แดง) | ✅ | ✅ | |
| จำกัดวงเงิน | ✅ | ✅ | |
| จ่ายครึ่ง | ✅ | ✅ | |
| ดูรายการข้อจำกัดทั้งหมด | ✅ | ✅ | |
| ลบข้อจำกัด | ✅ | ✅ | |
| รีเฟรช | ✅ | ✅ | |

### 🏆 ผลหวย

| Feature | Desktop | Mobile | หมายเหตุ |
|---|:---:|:---:|---|
| บันทึกผลด้วยมือ | ✅ | ✅ | |
| ดึงผลจาก API อัตโนมัติ | ✅ | — | admin action |
| ดูผลหวยย้อนหลัง | ✅ | ✅ | |
| กรองปี พ.ศ. | ✅ | ✅ | |
| แสดง Official badge | ✅ | ✅ | |

### 💰 ตรวจรางวัล & การเงิน

| Feature | Desktop | Mobile | หมายเหตุ |
|---|:---:|:---:|---|
| ตรวจรางวัลอัตโนมัติ | ✅ | — | หลังบันทึกผล |
| ดูยอดจ่ายรายงวด | ✅ | ✅ | |
| ดูกำไร/ขาดทุน | ✅ | ✅ | |
| สรุปยอดรายบ้าน | ✅ | — | |

### 🏠 บ้าน / Agent

| Feature | Desktop | Mobile | หมายเหตุ |
|---|:---:|:---:|---|
| จัดการบ้าน | ✅ | — | admin only |
| ดูยอดของบ้านตัวเอง | ✅ | ✅ | |
| ตั้งอัตราจ่ายแยกตามบ้าน | ✅ | — | |

### 📊 รายงาน

| Feature | Desktop | Mobile | หมายเหตุ |
|---|:---:|:---:|---|
| รายงานประจำงวด | ✅ | ✅ | |
| Export Excel | ✅ | — | desktop เท่านั้น |
| กรองตามช่วงวันที่ | ✅ | ✅ | |
| กรองตามประเภทหวย | ✅ | ✅ | ไทย / ลาว |

### ⚙️ ตั้งค่า

| Feature | Desktop | Mobile | หมายเหตุ |
|---|:---:|:---:|---|
| อัตราจ่ายแต่ละประเภท | ✅ | — | |
| เวลาเปิด/ปิดรับต่องวด | ✅ | — | |
| จัดการประเภทหวย (ไทย/ลาว) | ✅ | — | |
| จัดการ User / สิทธิ์ | ✅ | — | |

---

## Pages

| หน้า | URL | รองรับ |
|---|---|---|
| Login | `/login` | Desktop + Mobile |
| Dashboard | `/dashboard` | Desktop + Mobile |
| คีย์หวย | `/bet` | Desktop + Mobile |
| เลขอั้น | `/restrictions` | Desktop + Mobile |
| ผลหวย | `/results` | Desktop + Mobile |
| ผลหวยย้อนหลัง | `/results/history` | Desktop + Mobile |
| รายได้ | `/income` | Desktop + Mobile |
| รายงาน | `/reports` | Desktop (export) |
| บ้าน | `/houses` | Desktop |
| ตั้งค่า | `/settings` | Desktop |

---

## Auth & Access Control

### Token Strategy

> ใช้ภายใน — stateless JWT ธรรมดา ไม่ต้อง revoke

| Token | อายุ | เก็บที่ไหน (client) | เก็บที่ไหน (server) |
|---|---|---|---|
| Access Token | 15 นาที | memory (Zustand) | ไม่เก็บ — stateless |
| Refresh Token | 7 วัน | `httpOnly` cookie | ไม่เก็บ — stateless |

> Access Token ไม่เก็บใน localStorage — ป้องกัน XSS
> Refresh Token ใช้ `httpOnly` cookie — JavaScript อ่านไม่ได้

### Token Flow

```
Login
  → server ออก access_token + refresh_token
  → access_token ส่งใน response body
  → refresh_token เซต httpOnly cookie

ทุก request
  → ส่ง access_token ใน Authorization: Bearer header
  → JwtAuthGuard ตรวจ signature + expiry

Access token หมดอายุ (401)
  → client เรียก POST /auth/refresh (cookie ส่งอัตโนมัติ)
  → server verify refresh_token → ออก access_token ใหม่

Logout
  → server clear cookie
  → client ล้าง access_token ใน memory
```

### Implementation

```ts
// apps/api/src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(user: User) {
    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role, name: user.name },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
    )
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    )
    return { accessToken, refreshToken }
  }

  async refresh(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    })
    // verify สำเร็จ → ออก access_token ใหม่
    const user = await this.usersService.findById(payload.sub)
    return this.login(user)
  }
}
```

```ts
// apps/api/src/auth/auth.controller.ts
@Post('login')
async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
  const { accessToken, refreshToken } = await this.authService.login(...)

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/auth',
  })

  return { accessToken }
}

@Post('refresh')
async refresh(@Req() req: Request) {
  const token = req.cookies['refresh_token']
  return this.authService.refresh(token)
}

@Post('logout')
logout(@Res({ passthrough: true }) res: Response) {
  res.clearCookie('refresh_token', { path: '/auth' })
}

@Get('me')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user) {
  return user  // { id, name, role } จาก JWT payload
}
```

### Role (เผื่อขยาย)

```ts
// packages/shared/src/enums/user-role.enum.ts
export enum UserRole {
  ADMIN = 'admin',  // ใช้อยู่ตอนนี้
  HOUSE = 'house',  // เผื่อไว้
  AGENT = 'agent',  // เผื่อไว้
}
```

```ts
// ตอนนี้ Guard แค่เช็ค JWT อย่างเดียวพอ
@UseGuards(JwtAuthGuard)
@Get('/bets')
getBets() { ... }

// ขยายทีหลัง — ไม่ต้องแก้ schema
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Delete('/bets/:id')
deleteBet() { ... }
```

---

## สิ่งที่ต้องมีก่อน Launch

| รายการ | เหตุผล | Priority |
|---|---|---|
| Audit Log | ระบบการเงิน — ต้องรู้ว่าใครทำอะไรไว้ | 🔴 Critical |
| Soft Delete | บิล/ผลหวยห้าม hard delete | 🔴 Critical |
| Role field ใน users | เผื่อขยาย — ใช้เวลาน้อยมาก | 🔴 Critical |
| PWA | mobile UX ดีขึ้นมาก | 🟡 สำคัญ |
| Dashboard charts | เห็นภาพรวมได้เร็ว | 🟡 สำคัญ |
| Print slip | พิมพ์ใบรับแทงให้ลูกค้า | 🟡 สำคัญ |
| Export Excel | รายงานรายงวด | 🟡 สำคัญ |
| Prize structure config | ไทย/ลาว โครงสร้างรางวัลต่างกัน | 🟡 สำคัญ |
| LINE Notify | แจ้งเตือนผลหวย / ปิดรับ | 🟢 Nice to have |
| Rate limiting | ป้องกัน brute force | 🟢 Nice to have |
| Error monitoring (Sentry) | รู้ทันที error ใน production | 🟢 Nice to have |

### Dependencies เพิ่มเติม

```bash
# Frontend
pnpm add recharts          # dashboard charts
pnpm add react-to-print    # print slip
pnpm add next-pwa          # PWA

# Backend
pnpm add exceljs           # export Excel
pnpm add @nestjs/throttler # rate limiting
```

---

## Database Entities

> ทุก entity ที่มี `deleted_at` ใช้ Soft Delete — ห้าม hard delete ข้อมูลการเงิน

---

### `users`
| Column | Type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| email | varchar | unique |
| password | varchar | bcrypt hash |
| name | varchar | |
| role | enum | `admin` / `house` / `agent` — default `admin` |
| house_id | uuid FK? | nullable — เผื่อ multi-user |
| created_at | timestamp | |
| deleted_at | timestamp? | soft delete |

---

### `houses` — บ้าน
> เผื่อ multi-user — ตอนนี้ยังไม่ใช้ แต่ users.house_id FK ชี้มาที่นี่

| Column | Type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| name | varchar | ชื่อบ้าน |
| owner_id | uuid FK | → users |
| created_at | timestamp | |
| deleted_at | timestamp? | soft delete |

---

### `lottery_types` — ประเภทหวย
| Column | Type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| name | varchar | ชื่อแสดงผล |
| code | varchar | unique — ดูตาราง seed ด้านล่าง |
| draw_schedule_type | enum | `monthly_dates` / `weekdays` / `daily` |
| draw_days | json | ขึ้นกับ schedule_type — ดูตัวอย่างด้านล่าง |
| result_structure | enum | `thai_full` / `lao_5digit` / `lao_3_2` |
| close_before_minutes | int | ปิดรับก่อนออกผลกี่นาที |
| is_active | boolean | เปิด/ปิดประเภทนี้ |

#### Seed Data

| code | name | schedule_type | draw_days | result_structure |
|---|---|---|---|---|
| `TH` | หวยรัฐบาลไทย | `monthly_dates` | `[1, 16]` | `thai_full` |
| `LAO_PATTHANA` | หวยลาวพัฒนา | `weekdays` | `["MON","TUE","WED","THU","FRI"]` | `thai_full` |
| `LAO_SUPER` | หวยลาวซุปเปอร์ | `daily` | `[]` | `lao_5digit` |
| `LAO_STAR` | หวยลาวสตาร์/HD | `daily` | `[]` | `lao_3_2` |

> หวยลาวพัฒนาเริ่มออกทุกวันจันทร์-ศุกร์ ตั้งแต่ 2 เม.ย. 2569

---

### `prize_rates` — อัตราจ่ายต่อประเภทหวย
> ไม่ hardcode — ตั้งค่าได้ใน DB แยกตาม lottery_type

| Column | Type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| lottery_type_id | uuid FK | → lottery_types |
| bet_type | enum | ดูตารางด้านล่าง — แตกต่างกันตาม lottery_type |

#### bet_type ที่รองรับแต่ละประเภท

| bet_type | ความหมาย | TH | LAO_PATTHANA | LAO_SUPER | LAO_STAR |
|---|---|:---:|:---:|:---:|:---:|
| `5_top` | 5 ตัวบน | — | — | ✅ | — |
| `3_top` | 3 ตัวบน | ✅ | ✅ | — | ✅ |
| `3_tod` | 3 ตัวโต้ด | ✅ | ✅ | — | ✅ |
| `3_front` | 3 ตัวหน้า | ✅ | ✅ | — | — |
| `3_back` | 3 ตัวท้าย | ✅ | ✅ | — | — |
| `2_top` | 2 ตัวบน | ✅ | ✅ | ✅ | — |
| `2_bottom` | 2 ตัวล่าง | ✅ | ✅ | ✅ | ✅ |
| `run_top` | วิ่งบน | ✅ | ✅ | ✅ | ✅ |
| `run_bottom` | วิ่งล่าง | ✅ | ✅ | ✅ | ✅ |

> ⚠️ กรุณาตรวจสอบ bet_type ของลาวซุปเปอร์และลาวสตาร์ให้ตรงกับที่ใช้จริงครับ

| payout_rate | decimal | อัตราจ่าย เช่น 500, 100 |
| max_per_number | decimal | วงเงินสูงสุดต่อเลข (nullable = ไม่จำกัด) |

---

### `lottery_rounds` — งวด ⭐ entity กลางของระบบ
> บิล, ผลหวย, เลขอั้น ทุกอย่างผูกกับ round

| Column | Type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| lottery_type_id | uuid FK | → lottery_types |
| draw_date | date | วันออกผล |
| open_at | timestamp | เวลาเปิดรับ |
| close_at | timestamp | เวลาปิดรับ |
| status | enum | `open` / `closed` / `resulted` / `cancelled` |
| created_at | timestamp | |

```
status flow:
  open → (ถึงเวลา close_at) → closed → (บันทึกผล) → resulted
  open → (admin ยกเลิก)     → cancelled
```

---

### `lottery_results` — ผลหวย
> โครงสร้างผลต่างกันตาม `result_structure` ของ lottery_type

| Column | Type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| round_id | uuid FK | → lottery_rounds (unique) |
| first_prize | varchar? | 6 หลัก (thai_full) / 5 หลัก (lao_5digit) / null (lao_3_2) |
| three_top | varchar? | 3 ตัวบน — thai_full / lao_3_2 |
| three_front | varchar[]? | 3 ตัวหน้า — thai_full เท่านั้น |
| three_back | varchar[]? | 3 ตัวท้าย — thai_full เท่านั้น |
| two_last | varchar(2)? | 2 ตัวล่าง |
| is_official | boolean | ดึงจาก API = true / บันทึกมือ = false |
| source | enum | `api` / `manual` |
| created_at | timestamp | |

#### โครงสร้างผลแต่ละประเภท

| result_structure | ใช้กับ | field ที่มีค่า |
|---|---|---|
| `thai_full` | หวยไทย, ลาวพัฒนา | first_prize(6), three_front[], three_back[], two_last |
| `lao_5digit` | ลาวซุปเปอร์ | first_prize(5), two_last |
| `lao_3_2` | ลาวสตาร์/HD | three_top, two_last |

---

### `restrictions` — เลขอั้น
| Column | Type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| round_id | uuid FK | → lottery_rounds |
| number | varchar | เลขที่อั้น |
| bet_type | enum | `3_top` / `2_top` / `2_bottom` ฯลฯ |
| restriction_type | enum | `closed` / `limited` / `half_pay` |
| limit_amount | decimal? | nullable — ใช้เมื่อ `limited` |
| created_at | timestamp | |
| deleted_at | timestamp? | soft delete |

---

### `bets` — บิล (header)
| Column | Type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| round_id | uuid FK | → lottery_rounds |
| lottery_type_id | uuid FK | → lottery_types — snapshot ณ เวลาแทง |
| user_id | uuid FK | → users |
| note | varchar? | บันทึกช่วยจำ |
| total_amount | decimal | ยอดรวมบิล |
| status | enum | `pending` / `won` / `lost` / `cancelled` |
| created_at | timestamp | |
| deleted_at | timestamp? | soft delete |

---

### `bet_items` — รายการในบิล (detail)
| Column | Type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| bet_id | uuid FK | → bets |
| number | varchar | เลขที่แทง |
| bet_type | enum | ดูตารางด้านล่าง — แตกต่างกันตาม lottery_type |
| amount | decimal | ยอดแทง |
| payout_rate | decimal | snapshot อัตราจ่าย ณ เวลาแทง |
| win_amount | decimal? | nullable — กรอกหลังตรวจรางวัล |
| deleted_at | timestamp? | soft delete |

> `payout_rate` ต้อง snapshot ไว้ตอนแทง เพราะอัตราจ่ายอาจเปลี่ยนทีหลัง

---

### `audit_logs`
| Column | Type | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | → users |
| action | varchar | เช่น `CREATE_BET`, `DELETE_BET`, `UPDATE_PRIZE_RATE` |
| entity_type | varchar | เช่น `bets`, `restrictions` |
| entity_id | uuid? | id ของ record ที่ถูก action |
| before | json? | ค่าก่อนเปลี่ยน |
| after | json? | ค่าหลังเปลี่ยน |
| ip_address | varchar | |
| created_at | timestamp | ไม่มี deleted_at — ลบ log ไม่ได้ |

---

### ความสัมพันธ์ภาพรวม

```
lottery_types
  ├── prize_rates        (อัตราจ่ายต่อประเภท)
  └── lottery_rounds     (งวดต่อประเภท)
        ├── lottery_results  (ผลหวย 1 งวด = 1 ผล)
        ├── restrictions     (เลขอั้นของงวดนี้)
        └── bets             (บิลทั้งหมดของงวดนี้)
              └── bet_items  (รายการเลขในบิล)

houses
  └── users
        └── bets

audit_logs ← users (ทุก action บันทึกไว้)
```

---

## Database conventions

### Migration — ทำทุกครั้งที่แก้ schema

> ห้าม `synchronize: true` ใน production เด็ดขาด

```bash
# สร้าง migration file หลังแก้ entity
pnpm --filter api typeorm migration:generate src/migrations/AddDrawTimeToLotteryTypes

# รัน migration
pnpm --filter api typeorm migration:run

# ย้อนกลับ (ถ้าจำเป็น)
pnpm --filter api typeorm migration:revert
```

```ts
// apps/api/src/data-source.ts
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,  // ปิดเสมอ — ใช้ migration เท่านั้น
})
```

**workflow ทุกครั้งที่แก้ entity:**
1. แก้ `.entity.ts`
2. `migration:generate` → ได้ไฟล์ migration
3. ตรวจไฟล์ migration ก่อน run เสมอ
4. `migration:run`
5. commit ทั้ง entity + migration file เข้า git พร้อมกัน

---

### FK Policy — ไม่ใช้ DB Foreign Key Constraint

> เก็บแค่ `id` column — ไม่ทำ FK constraint ระดับ DB
> ใช้ TypeORM `@JoinColumn` + `@ManyToOne` สำหรับ join เท่านั้น

**เหตุผล:**
- Soft delete ทำได้ง่ายกว่า — ไม่ติด constraint ตอน delete
- Migration ง่ายกว่า — ไม่ต้องจัดการ FK dependency order
- ยืดหยุ่นกว่าตอน seed / import ข้อมูล

```ts
// ✅ แบบที่ใช้ — เก็บ id เฉยๆ ไม่มี FK constraint
@Entity('bets')
export class Bet {
  @Column({ type: 'uuid' })
  round_id: string          // แค่ column ธรรมดา ไม่มี FK

  @Column({ type: 'uuid' })
  user_id: string

  // Relation สำหรับ join — ไม่สร้าง FK constraint ใน DB
  @ManyToOne(() => LotteryRound)
  @JoinColumn({ name: 'round_id' })
  round: LotteryRound

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}
```

```ts
// ✅ การ join ใช้ TypeORM ปกติ
const bet = await this.betsRepo.findOne({
  where: { id },
  relations: ['round', 'user', 'items'],
})

// หรือ QueryBuilder
const bets = await this.betsRepo
  .createQueryBuilder('b')
  .leftJoinAndSelect('b.round', 'round')
  .where('b.round_id = :roundId', { roundId })
  .getMany()
```

> **หมายเหตุ:** Integrity ต้องดูแลในระดับ application เอง — เช่น เช็คว่า `round_id` มีอยู่จริงก่อน save

---



### Layout

เลือกประเภทหวยก่อน → แสดง rate ของประเภทนั้น

```
[หวยไทย] [ลาวพัฒนา] [ลาวซุปเปอร์] [ลาวสตาร์]
          ↑ tab / segmented control

┌─────────────────┬─────────────────┐
│ 3 ตัวบน   500  │ 3 ตัวโต้ด  120 │
├─────────────────┼─────────────────┤
│ 2 ตัวบน    70  │ 2 ตัวล่าง   90 │
├─────────────────┼─────────────────┤
│ วิ่งบน    3.2  │ วิ่งล่าง   4.2 │
└─────────────────┴─────────────────┘
```

### กฎการแสดง bet_type

แสดงเฉพาะ bet_type ที่ประเภทนั้นรองรับ — ดูจาก matrix ใน `prize_rates`

| ประเภท | bet_type ที่แสดง |
|---|---|
| หวยไทย | 3บน, 3โต้ด, 3หน้า, 3ท้าย, 2บน, 2ล่าง, วิ่งบน, วิ่งล่าง |
| ลาวพัฒนา | 3บน, 3โต้ด, 3หน้า, 3ท้าย, 2บน, 2ล่าง, วิ่งบน, วิ่งล่าง |
| ลาวซุปเปอร์ | 5บน, 2บน, 2ล่าง, วิ่งบน, วิ่งล่าง |
| ลาวสตาร์ | 3บน, 3โต้ด, 2ล่าง, วิ่งบน, วิ่งล่าง |

### Interaction

- กด tab → load rate ของประเภทนั้นจาก `GET /lottery-types/:id/prize-rates`
- กดที่ตัวเลข → inline edit ได้เลย (ไม่ต้องมีปุ่ม Edit แยก)
- แก้แล้ว blur หรือกด Enter → `PATCH /prize-rates/:id` ทันที
- แสดง success toast เบาๆ เมื่อบันทึกสำเร็จ



> ปัญหา: ถ้า 2 request มาพร้อมกัน อาจรับเกิน `limit_amount` ได้

### วิธีแก้ — Pessimistic Lock (`SELECT ... FOR UPDATE`)

เหมาะกับระบบขนาดนี้ — ง่าย ไม่ต้อง Redis counter แยก

```ts
// apps/api/src/bets/bets.service.ts
async createBet(dto: CreateBetDto) {
  return this.dataSource.transaction(async (manager) => {
    for (const item of dto.items) {
      // Lock restriction row ของเลขนี้ก่อน
      const restriction = await manager
        .getRepository(Restriction)
        .createQueryBuilder('r')
        .setLock('pessimistic_write')   // SELECT ... FOR UPDATE
        .where('r.round_id = :roundId', { roundId: dto.roundId })
        .andWhere('r.number = :number', { number: item.number })
        .andWhere('r.bet_type = :betType', { betType: item.betType })
        .andWhere('r.deleted_at IS NULL')
        .getOne()

      if (!restriction) continue  // ไม่มีข้อจำกัด — รับได้ปกติ

      if (restriction.restriction_type === 'closed') {
        throw new BadRequestException(`เลข ${item.number} ปิดรับแล้ว`)
      }

      if (restriction.restriction_type === 'limited') {
        // นับยอดที่รับไปแล้ว (เฉพาะ active bets)
        const accepted = await manager
          .getRepository(BetItem)
          .createQueryBuilder('bi')
          .innerJoin('bi.bet', 'b')
          .where('b.round_id = :roundId', { roundId: dto.roundId })
          .andWhere('bi.number = :number', { number: item.number })
          .andWhere('bi.bet_type = :betType', { betType: item.betType })
          .andWhere('b.status != :cancelled', { cancelled: 'cancelled' })
          .andWhere('b.deleted_at IS NULL')
          .select('SUM(bi.amount)', 'total')
          .getRawOne()

        const totalAccepted = new Decimal(accepted.total ?? 0)
        const remaining = new Decimal(restriction.limit_amount).minus(totalAccepted)

        if (remaining.lte(0)) {
          throw new BadRequestException(`เลข ${item.number} เต็มแล้ว`)
        }
        // รับได้แค่เท่าที่เหลือ หรือ throw ถ้าต้องการ strict
        if (new Decimal(item.amount).gt(remaining)) {
          throw new BadRequestException(
            `เลข ${item.number} รับได้อีกแค่ ${remaining.toFixed(2)}`
          )
        }
      }
    }

    // ผ่านทุก check แล้ว — save bet + bet_items
    return this.saveBet(manager, dto)
  })
}
```

### Cancelled Bet — คืน Limit

**กฎ: ยกเลิกบิล → คืน limit เสมอ**

เหตุผล: ถ้าไม่คืน admin ต้องมาแก้ limit มือ — error-prone กว่า

```ts
// การนับ limit_amount จะ exclude bets ที่ status = 'cancelled'
// และ deleted_at IS NOT NULL อยู่แล้วใน query ด้านบน
// → cancel บิล = ยอดนั้นหายออกจาก SUM ทันที ไม่ต้องทำอะไรเพิ่ม
```

> ไม่ต้องมี field `used_amount` แยก — `SUM` ณ เวลา request เป็น source of truth

---

## Business Logic — สำคัญ

### `three_top` ของหวยไทย

หวยไทย (`thai_full`) ไม่มี `three_top` field แยก — derive จาก `first_prize` เองตอนตรวจรางวัล

```ts
// packages/shared/src/lottery-utils.ts
function getThreeTop(result: LotteryResult): string | null {
  if (result.three_top) return result.three_top          // lao_3_2
  if (result.first_prize) return result.first_prize.slice(-3)  // thai_full, lao_5digit
  return null
}
```

> ไม่เก็บแยกใน DB — ลด redundancy และป้องกัน inconsistency

---

## หน้า `/income` — รายได้

### แสดงอะไร

สรุปรายได้ต่องวด — ดูได้ทั้ง Desktop และ Mobile

| ส่วน | รายละเอียด |
|---|---|
| ยอดรับรวม | `SUM(bet_items.amount)` ของงวดนั้น |
| ยอดจ่ายรวม | `SUM(bet_items.win_amount)` ของงวดนั้น |
| กำไร/ขาดทุน | ยอดรับ − ยอดจ่าย |
| Breakdown | แยกตามประเภทหวย (ไทย / ลาวพัฒนา / ลาวซุปเปอร์ / ลาวสตาร์) |
| Breakdown | แยกตาม bet_type (3บน / 2บน / 2ล่าง / วิ่ง ฯลฯ) |

### API Endpoint เพิ่มเติม

```
GET /income/summary?roundId=xxx
GET /income/summary?lotteryTypeId=xxx&from=2026-05-01&to=2026-05-31
```

Response:

```json
{
  "roundId": "xxx",
  "totalReceived": "15000.00",
  "totalPayout": "8500.00",
  "profit": "6500.00",
  "byLotteryType": [
    {
      "code": "TH",
      "name": "หวยรัฐบาลไทย",
      "received": "10000.00",
      "payout": "6000.00",
      "profit": "4000.00"
    }
  ],
  "byBetType": [
    { "betType": "3_top", "received": "5000.00", "payout": "3000.00" }
  ]
}
```

> งวดสร้างอัตโนมัติทุกวัน — ไม่ต้องสร้างมือ

### กลไก

- **Cron job** รันทุกเที่ยงคืน (Asia/Bangkok)
- สร้างงวดล่วงหน้า **7 วัน** สำหรับทุก `lottery_type` ที่ `is_active = true`
- เช็คก่อนสร้าง — ถ้ามี round ของวันนั้นอยู่แล้ว ข้ามไป (idempotent)
- คำนวณ `open_at` / `close_at` จาก `draw_schedule` และ `close_before_minutes` ของแต่ละประเภท

### Implementation (NestJS)

```ts
// apps/api/src/rounds/rounds-scheduler.service.ts
import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

@Injectable()
export class RoundsSchedulerService {
  constructor(
    private readonly lotteryTypesRepo: Repository<LotteryType>,
    private readonly roundsRepo: Repository<LotteryRound>,
  ) {}

  @Cron('0 0 * * *', { timeZone: 'Asia/Bangkok' })
  async generateUpcomingRounds() {
    const lotteryTypes = await this.lotteryTypesRepo.find({
      where: { is_active: true },
    })

    for (const lt of lotteryTypes) {
      for (let i = 0; i < 7; i++) {
        const targetDate = dayjs().tz('Asia/Bangkok').add(i, 'day')

        if (!this.isDrawDay(lt, targetDate)) continue

        const existing = await this.roundsRepo.findOne({
          where: {
            lottery_type_id: lt.id,
            draw_date: targetDate.format('YYYY-MM-DD'),
          },
        })
        if (existing) continue

        const drawTime = this.getDrawTime(lt, targetDate)
        const closeAt = drawTime.subtract(lt.close_before_minutes, 'minute')
        const openAt = targetDate.startOf('day')

        await this.roundsRepo.save({
          lottery_type_id: lt.id,
          draw_date: targetDate.format('YYYY-MM-DD'),
          open_at: openAt.toDate(),
          close_at: closeAt.toDate(),
          status: RoundStatus.OPEN,
        })
      }
    }
  }

  private isDrawDay(lt: LotteryType, date: Dayjs): boolean {
    switch (lt.draw_schedule_type) {
      case 'daily':
        return true
      case 'monthly_dates':
        return (lt.draw_days as number[]).includes(date.date())
      case 'weekdays':
        return (lt.draw_days as string[]).includes(date.format('ddd').toUpperCase())
    }
  }

  private getDrawTime(lt: LotteryType, date: Dayjs): Dayjs {
    // draw time per lottery_type — ตั้งค่าได้ใน lottery_types
    // ตัวอย่าง: หวยไทย 15:30, ลาวพัฒนา 20:00
    return dayjs.tz(
      `${date.format('YYYY-MM-DD')} ${lt.draw_time}`,
      'Asia/Bangkok',
    )
  }
}
```

### Schema เพิ่มเติมใน `lottery_types`

```ts
// เพิ่ม column draw_time
draw_time: varchar  // เวลาออกผล เช่น "15:30", "20:00"
```

| Column | Type | หมายเหตุ |
|---|---|---|
| draw_time | varchar | เวลาออกผล format `HH:mm` เช่น `"15:30"` |

#### ตัวอย่าง Seed

| code | draw_time |
|---|---|
| `TH` | `15:30` |
| `LAO_PATTHANA` | `20:00` |
| `LAO_SUPER` | `21:00` |
| `LAO_STAR` | `21:30` |

> ⚠️ ตรวจสอบเวลาออกผลจริงของแต่ละประเภทก่อน seed

### Admin — Cancel Round

กรณีวันหยุดพิเศษ หรือหวยงดออก admin สามารถยกเลิกงวดได้

```ts
// เพิ่ม endpoint
PATCH /rounds/:id/cancel
```

```ts
// status ที่เพิ่มมา
status: 'open' | 'closed' | 'resulted' | 'cancelled'
```

> งวดที่ `cancelled` — บิลที่แทงไปแล้ว (ถ้ามี) ต้องคืนสถานะเป็น `cancelled` ด้วย

### สรุป Flow

```
เที่ยงคืน (cron)
  → loop lottery_types ที่ is_active
    → เช็ค draw_schedule → วันนั้นมีออกไหม?
      → ถ้ามี round อยู่แล้ว → skip
      → ถ้ายังไม่มี → สร้าง round (status: open)

admin พบว่าวันนั้นหวยงด
  → PATCH /rounds/:id/cancel
  → status → cancelled
```

---

## Timezone — UTC+7

> ⚠️ ระบบหวยมี deadline ที่แม่นยำมาก ถ้า timezone ผิดปิดรับผิดเวลาเป็นปัญหาใหญ่

```env
# apps/api/.env
TZ=Asia/Bangkok
```

```ts
// TypeORM — บันทึก timestamp ใน UTC เสมอ แต่ query กลับเป็น UTC+7
// ใช้ dayjs แปลงก่อนแสดงผลเสมอ
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Bangkok')

// ตัวอย่าง: สร้าง close_at ของงวด
const closeAt = dayjs.tz('2026-05-16 15:30', 'Asia/Bangkok').toDate()
// → เก็บใน DB เป็น UTC: 2026-05-16T08:30:00Z
```

```ts
// NestJS main.ts — set process timezone
process.env.TZ = 'Asia/Bangkok'
```

---

## API Endpoints

### Auth
| Method | Endpoint | หมายเหตุ |
|---|---|---|
| POST | `/auth/login` | email + password → access/refresh token |
| POST | `/auth/refresh` | refresh token → access token ใหม่ |
| POST | `/auth/logout` | clear cookie |
| GET | `/auth/me` | ดึงข้อมูล user จาก token |

### Lottery Types (public read / admin write)
| Method | Endpoint | หมายเหตุ |
|---|---|---|
| GET | `/lottery-types` | รายการประเภทหวยทั้งหมด |
| PATCH | `/lottery-types/:id` | แก้ไข (Admin) |

### Prize Rates
| Method | Endpoint | หมายเหตุ |
|---|---|---|
| GET | `/lottery-types/:id/prize-rates` | อัตราจ่ายของประเภทนั้น |
| PATCH | `/prize-rates/:id` | แก้ไขอัตราจ่าย (Admin) |

### Rounds
| Method | Endpoint | หมายเหตุ |
|---|---|---|
| GET | `/rounds?lotteryTypeId=&status=` | รายการงวด |
| GET | `/rounds/current` | งวดปัจจุบัน (status=open) |
| POST | `/rounds` | สร้างงวดใหม่ manual (Admin) |
| PATCH | `/rounds/:id/status` | เปลี่ยน status (Admin) |
| PATCH | `/rounds/:id/cancel` | ยกเลิกงวด (Admin) |

### Results
| Method | Endpoint | หมายเหตุ |
|---|---|---|
| GET | `/rounds/:id/result` | ผลของงวดนั้น |
| POST | `/rounds/:id/result` | บันทึกผล (Admin) |
| POST | `/rounds/:id/result/fetch` | ดึงผลจาก API ภายนอก (Admin) |

### Bets
| Method | Endpoint | หมายเหตุ |
|---|---|---|
| GET | `/bets?roundId=&page=&pageSize=` | รายการบิล |
| GET | `/bets/:id` | รายละเอียดบิล + bet_items |
| POST | `/bets` | สร้างบิลใหม่ (พร้อม bet_items) |
| DELETE | `/bets/:id` | ยกเลิกบิล (soft delete) |

### Restrictions
| Method | Endpoint | หมายเหตุ |
|---|---|---|
| GET | `/rounds/:id/restrictions` | เลขอั้นของงวดนั้น |
| POST | `/rounds/:id/restrictions` | เพิ่มเลขอั้น |
| DELETE | `/restrictions/:id` | ลบเลขอั้น (soft delete) |

### Income
| Method | Endpoint | หมายเหตุ |
|---|---|---|
| GET | `/income/summary?roundId=` | สรุปรายได้รายงวด |
| GET | `/income/summary?lotteryTypeId=&from=&to=` | สรุปรายได้ตามช่วงวันที่ |

### Reports
| Method | Endpoint | หมายเหตุ |
|---|---|---|
| GET | `/reports/summary?roundId=` | สรุปยอดรายงวด |
| GET | `/reports/export?roundId=` | export Excel |


---

## Countdown ปิดรับ — Mechanism

> ใช้ **Polling** — ง่าย เพียงพอสำหรับระบบนี้ ไม่ต้อง WebSocket

### กลไก

- Frontend เรียก `GET /rounds/current` ทุก **30 วินาที**
- ได้ `close_at` กลับมา → คำนวณ countdown ใน client เอง
- ระหว่าง 30 วิ — นับถอยหลังจาก `close_at` ด้วย `setInterval` ทุก 1 วิ

```ts
// apps/web/lib/hooks/useCountdown.ts
export function useCountdown(closeAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0)

  useEffect(() => {
    if (!closeAt) return

    const tick = () => {
      const diff = dayjs(closeAt).diff(dayjs(), 'second')
      setSecondsLeft(Math.max(0, diff))
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [closeAt])

  return secondsLeft
}
```

```ts
// apps/web/lib/hooks/useCurrentRound.ts
export function useCurrentRound(lotteryTypeId: string) {
  return useQuery({
    queryKey: ['round', 'current', lotteryTypeId],
    queryFn: () => api.get(`/rounds/current?lotteryTypeId=${lotteryTypeId}`),
    refetchInterval: 30_000,   // poll ทุก 30 วิ
    refetchIntervalInBackground: false,
  })
}
```

```tsx
// แสดงผล
const { data: round } = useCurrentRound(lotteryTypeId)
const secondsLeft = useCountdown(round?.close_at)

const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
const ss = String(secondsLeft % 60).padStart(2, '0')

// สีเปลี่ยนเมื่อใกล้ปิด
const isUrgent = secondsLeft <= 300  // 5 นาที

<span className={isUrgent ? 'text-red-500' : 'text-green-600'}>
  {mm}:{ss}
</span>
```

### Edge cases

| กรณี | วิธีจัดการ |
|---|---|
| `close_at` ผ่านไปแล้ว | countdown แสดง 00:00 + disable ปุ่มแทง |
| ไม่มี round ที่ open | แสดง "ปิดรับแล้ว" |
| network error ตอน poll | ใช้ค่าเดิม — นับต่อจาก `close_at` ที่มีอยู่ |


> ทุก endpoint ใช้รูปแบบเดียวกัน — frontend handle ได้สม่ำเสมอ

```json
{
  "statusCode": 400,
  "message": "เลข 123 ปิดรับแล้ว",
  "error": "BAD_REQUEST"
}
```

### NestJS Global Exception Filter

```ts
// apps/api/src/common/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    response.status(status).json({
      statusCode: status,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message,
      error: HttpStatus[status],
    })
  }
}

// apps/api/src/main.ts
app.useGlobalFilters(new HttpExceptionFilter())
```

### Error codes ที่ใช้บ่อย

| statusCode | สถานการณ์ |
|---|---|
| 400 | ข้อมูลไม่ถูกต้อง, เลขปิดรับ, เกิน limit |
| 401 | token หมดอายุ หรือไม่มี token |
| 403 | มี token แต่ไม่มีสิทธิ์ |
| 404 | ไม่พบ resource |
| 409 | conflict เช่น round ซ้ำ |
| 500 | server error |

### Frontend — handle error

```ts
// lib/api.ts — axios interceptor
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // access token หมด → refresh
      await refreshToken()
      return api.request(error.config)
    }
    // แสดง toast error จาก message
    toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาด')
    return Promise.reject(error)
  }
)
```

---

## Database Indexes

> เพิ่ม index บน column ที่ query บ่อย — ป้องกัน slow query เมื่อข้อมูลเยอะ

```ts
// ใช้ @Index() decorator บน entity

@Entity('bet_items')
@Index(['bet_id'])                              // ดึง items ของบิล
@Index(['number', 'bet_type'])                  // เช็ค restriction + limit
export class BetItem { ... }

@Entity('bets')
@Index(['round_id'])                            // ดึงบิลของงวด
@Index(['round_id', 'status'])                  // filter status ในงวด
@Index(['user_id'])                             // ดึงบิลของ user
export class Bet { ... }

@Entity('restrictions')
@Index(['round_id'])                            // ดึง restriction ของงวด
@Index(['round_id', 'number', 'bet_type'])      // lookup ตอน validate bet
export class Restriction { ... }

@Entity('lottery_rounds')
@Index(['lottery_type_id', 'status'])           // หา open round
@Index(['lottery_type_id', 'draw_date'])        // เช็ค round ซ้ำตอน generate
export class LotteryRound { ... }

@Entity('audit_logs')
@Index(['user_id'])
@Index(['entity_type', 'entity_id'])
export class AuditLog { ... }
```

---

## Environment Config

### Local vs Production

| Config | Local | Production (Railway) |
|---|---|---|
| `DATABASE_URL` | localhost | Railway PostgreSQL URL |
| `REDIS_URL` | localhost:6379 | Railway Redis URL |
| `cookie.secure` | `false` | `true` (HTTPS only) |
| `cookie.sameSite` | `'lax'` | `'strict'` |
| `CORS origin` | `http://localhost:3000` | production domain |
| `synchronize` | `false` | `false` |

```ts
// apps/api/src/auth/auth.controller.ts
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth',
})
```

```ts
// apps/api/src/main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,  // จำเป็นสำหรับ cookie
})
```

```env
# apps/api/.env.production
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

---

## Bet Validation Rules

> ระบุกี่หลัก + ตัวอักษรที่รับได้ต่อ bet_type — ใช้ทั้ง backend validate และ frontend แสดง keyboard

| bet_type | หลัก | ตัวอย่าง | หมายเหตุ |
|---|---|---|---|
| `5_top` | 5 | `12345` | ตัวเลขเท่านั้น |
| `3_top` | 3 | `123` | ตัวเลขเท่านั้น |
| `3_tod` | 3 | `123` | ตัวเลขเท่านั้น |
| `3_front` | 3 | `123` | ตัวเลขเท่านั้น |
| `3_back` | 3 | `123` | ตัวเลขเท่านั้น |
| `2_top` | 2 | `12` | ตัวเลขเท่านั้น |
| `2_bottom` | 2 | `12` | ตัวเลขเท่านั้น |
| `run_top` | 1 | `5` | ตัวเลขเท่านั้น |
| `run_bottom` | 1 | `5` | ตัวเลขเท่านั้น |

### Backend Validation (Zod / class-validator)

```ts
// packages/shared/src/validators/bet.validator.ts
export const BET_TYPE_DIGIT_COUNT: Record<BetType, number> = {
  '5_top':      5,
  '3_top':      3,
  '3_tod':      3,
  '3_front':    3,
  '3_back':     3,
  '2_top':      2,
  '2_bottom':   2,
  'run_top':    1,
  'run_bottom': 1,
}

export function validateBetNumber(number: string, betType: BetType): boolean {
  const digits = BET_TYPE_DIGIT_COUNT[betType]
  return /^\d+$/.test(number) && number.length === digits
}
```

### Frontend — keyboard + maxLength

```tsx
// กำหนด maxLength จาก bet_type ที่เลือก
<input
  inputMode="numeric"
  maxLength={BET_TYPE_DIGIT_COUNT[selectedBetType]}
  pattern="\d*"
/>
```

---

## สถานะโปรเจค (Session Log)

> อัปเดตทุกครั้งที่มีการเปลี่ยนแปลงสำคัญ

### ✅ เสร็จแล้ว

#### Infrastructure
- [x] pnpm monorepo root (`package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`)
- [x] `.npmrc` สำหรับ native build dependencies
- [x] `README.md`

#### `packages/shared`
- [x] Enums: `UserRole`, `BetType`, `DrawScheduleType`, `ResultStructure`, `RoundStatus`, `BetStatus`, `RestrictionType`, `ResultSource`
- [x] Constants: `BET_TYPE_LABEL`, `BET_TYPE_DIGIT_COUNT`, `LOTTERY_TYPE_BET_TYPES`
- [x] Lottery Utils: `permute()`, `rude()`, `nineteenGates()`, `checkPrize()`, `getThreeTop()`
- [x] Validators: `validateBetNumber()`
- [x] Types/DTOs: `CreateBetDto`, `CreateRestrictionDto`, `IncomeSummaryResponse` ฯลฯ

#### `apps/api` (NestJS · port 3001)
- [x] Entities ครบ 10 ตาราง: `User`, `House`, `LotteryType`, `PrizeRate`, `LotteryRound`, `LotteryResult`, `Restriction`, `Bet`, `BetItem`, `AuditLog`
- [x] Modules: `Auth`, `LotteryTypes`, `Rounds`, `Bets`, `Restrictions`, `Income`
- [x] `AuthService` — JWT Access Token (memory) + Refresh Token (httpOnly cookie)
- [x] `JwtStrategy` + `JwtAuthGuard`
- [x] `BetsService` — Pessimistic Lock (`SELECT ... FOR UPDATE`) ป้องกัน race condition
- [x] `RoundsSchedulerService` — Cron สร้างงวดล่วงหน้า 7 วัน อัตโนมัติทุกเที่ยงคืน
- [x] `HttpExceptionFilter` — error format สม่ำเสมอ
- [x] `CurrentUser` + `Roles` decorators
- [x] Migration `1700000000000-InitSchema` — สร้าง tables + indexes + seed data ครบ
- [x] **API รันสำเร็จ** (port 3001) — ทุก route map ถูกต้อง

#### `apps/web` (Next.js 15 · port 3000)
- [x] Tailwind CSS v4 setup (`globals.css` + `postcss.config.mjs`)
- [x] UI components: `Button`, `Input`, `Label`, `Card`, `Badge`, `Toast`
- [x] Form components: `FormInput`, `FormNumericInput`, `FormSelect`
- [x] Layout: `Sidebar` (desktop) + `BottomNav` (mobile)
- [x] Stores: `useAuthStore` (JWT in memory), `useBetStore`
- [x] Hooks: `useCountdown`, `useLotteryTypes`, `usePrizeRates`, `useRounds`, `useBets`, `useRestrictions`, `useResults`, `useIncome`
- [x] Axios interceptor — auto refresh token เมื่อ 401
- [x] หน้า Login — React Hook Form + Zod validation
- [x] หน้า Dashboard
- [x] หน้า คีย์หวย (`/bet`)
- [x] หน้า เลขอั้น (`/restrictions`)
- [x] หน้า ผลหวย (`/results`)
- [x] หน้า รายได้ (`/income`)
- [x] หน้า รายงาน (`/reports`)
- [x] หน้า ตั้งค่า (`/settings`)
- [x] หน้า บ้าน (`/houses` — placeholder)

#### Database
- [x] Supabase project เชื่อมต่อสำเร็จ
- [x] Environment config — แยก `DATABASE_URL` (pooler port 6543) และ `DIRECT_URL` (migration port 5432)
- [x] **Migration รันสำเร็จ** — tables + seed data พร้อมใช้งาน

---

### 🔲 ยังไม่ได้ทำ (ทำต่อได้เลย)

#### Backend
- [ ] Seed admin user จริง (ตอนนี้ password hash hardcode — ควร bcrypt ใหม่)
- [ ] `GET /reports/export` — export Excel (exceljs)
- [ ] `POST /rounds/:id/result/fetch` — ดึงผลจาก API ภายนอก
- [ ] Prize checking service — คำนวณ `win_amount` หลังบันทึกผล
- [ ] AuditLog service — บันทึก log ทุก action สำคัญ

#### Frontend
- [ ] หน้า `/results/history` — ผลหวยย้อนหลัง
- [ ] Countdown แสดงสีแดงเมื่อใกล้ปิด (component มีแล้ว ต้องทดสอบ)
- [ ] Toast notification — แสดง success/error หลัง mutation
- [ ] Print slip — `react-to-print`
- [ ] Export Excel button ใน `/reports`
- [ ] PWA setup (`next-pwa`)
- [ ] Dashboard charts (`recharts`)

#### ยังไม่ได้ตั้งค่า
- [ ] `SUPABASE_SERVICE_KEY` ใน `.env`
- [ ] JWT secrets ใน `.env` (ปัจจุบัน placeholder)
- [ ] `CORS_ORIGIN` สำหรับ production
