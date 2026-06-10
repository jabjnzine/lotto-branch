import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersService } from './users.service'
import { UserRole } from '@lotto/shared'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  @Post()
  create(@Body() body: { email: string; password: string; name: string; role: UserRole; house_id?: string | null }) {
    return this.usersService.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; role?: UserRole; house_id?: string | null; password?: string }) {
    return this.usersService.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id)
  }
}
