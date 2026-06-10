import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { HousesModule } from './houses/houses.module'
import { LotteryTypesModule } from './lottery-types/lottery-types.module'
import { RoundsModule } from './rounds/rounds.module'
import { BetsModule } from './bets/bets.module'
import { RestrictionsModule } from './restrictions/restrictions.module'
import { IncomeModule } from './income/income.module'

// Entities
import { User } from './entities/user.entity'
import { House } from './entities/house.entity'
import { SystemConfig } from './entities/system-config.entity'
import { LotteryType } from './entities/lottery-type.entity'
import { PrizeRate } from './entities/prize-rate.entity'
import { LotteryRound } from './entities/lottery-round.entity'
import { LotteryResult } from './entities/lottery-result.entity'
import { Restriction } from './entities/restriction.entity'
import { Bet } from './entities/bet.entity'
import { BetItem } from './entities/bet-item.entity'
import { AuditLog } from './entities/audit-log.entity'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      entities: [
        User, House, SystemConfig, LotteryType, PrizeRate,
        LotteryRound, LotteryResult, Restriction,
        Bet, BetItem, AuditLog,
      ],
      migrations: ['dist/migrations/*.js'],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      extra: {
        options: '-c timezone=UTC',
      },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    UsersModule,
    HousesModule,
    LotteryTypesModule,
    RoundsModule,
    BetsModule,
    RestrictionsModule,
    IncomeModule,
  ],
})
export class AppModule {}
