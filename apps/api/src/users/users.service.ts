import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull, Not } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../entities/user.entity'
import { UserRole } from '@lotto/shared'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async findAll() {
    return this.usersRepo.find({
      where: { deleted_at: IsNull() },
      order: { created_at: 'ASC' },
      select: ['id', 'email', 'name', 'role', 'house_id', 'created_at'],
    })
  }

  async create(data: { email: string; password: string; name: string; role: UserRole; house_id?: string | null }) {
    const exists = await this.usersRepo.findOne({ where: { email: data.email } })
    if (exists) throw new ConflictException('อีเมลนี้ถูกใช้แล้ว')
    const hashed = await bcrypt.hash(data.password, 10)
    const user = this.usersRepo.create({ ...data, password: hashed })
    const saved = await this.usersRepo.save(user)
    const { password: _, ...rest } = saved
    return rest
  }

  async update(id: string, data: { name?: string; role?: UserRole; house_id?: string | null; password?: string }) {
    const user = await this.usersRepo.findOne({ where: { id, deleted_at: IsNull() } })
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้')
    if (data.name !== undefined) user.name = data.name
    if (data.role !== undefined) user.role = data.role
    if ('house_id' in data) user.house_id = data.house_id ?? null
    if (data.password) user.password = await bcrypt.hash(data.password, 10)
    const saved = await this.usersRepo.save(user)
    const { password: _, ...rest } = saved
    return rest
  }

  async remove(id: string) {
    const user = await this.usersRepo.findOne({ where: { id, deleted_at: IsNull() } })
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้')
    user.deleted_at = new Date()
    await this.usersRepo.save(user)
    return { ok: true }
  }
}
