import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'

dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

// Migration ใช้ DIRECT_URL (ไม่ผ่าน pgbouncer) เพราะ pgbouncer ไม่รองรับ DDL
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [isProd ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts'],
  migrations: [isProd ? 'dist/migrations/*.js' : 'src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
})
