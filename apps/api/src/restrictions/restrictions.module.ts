import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Restriction } from '../entities/restriction.entity'
import { RestrictionsService } from './restrictions.service'
import { RestrictionsController, RestrictionItemController } from './restrictions.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Restriction])],
  providers: [RestrictionsService],
  controllers: [RestrictionsController, RestrictionItemController],
  exports: [RestrictionsService],
})
export class RestrictionsModule {}
