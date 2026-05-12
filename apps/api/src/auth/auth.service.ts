import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { User } from '../entities/user.entity'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { email } })
    if (!user) throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง')

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง')

    return user
  }

  async login(user: User) {
    const payload = { sub: user.id, name: user.name, role: user.role }

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
    })

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
      },
    )

    return { accessToken, refreshToken, user: { id: user.id, name: user.name, role: user.role } }
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? '',
      })
      const user = await this.usersRepo.findOne({ where: { id: payload.sub } })
      if (!user) throw new UnauthorizedException()
      return this.login(user)
    } catch {
      throw new UnauthorizedException('Refresh token ไม่ถูกต้องหรือหมดอายุ')
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException()
    return { id: user.id, name: user.name, role: user.role, email: user.email }
  }
}
