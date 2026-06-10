import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { House } from '../entities/house.entity'
import { SystemConfig } from '../entities/system-config.entity'
import { HousesService } from './houses.service'
import { HousesController } from './houses.controller'

@Module({
  imports: [TypeOrmModule.forFeature([House, SystemConfig])],
  controllers: [HousesController],
  providers: [HousesService],
  exports: [HousesService],
})
export class HousesModule {}
