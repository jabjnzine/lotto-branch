import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common'
import { IsEmail, IsString, MinLength } from 'class-validator'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

class LoginDto {
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email!: string

  @IsString()
  @MinLength(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  password!: string
}

class RefreshDto {
  @IsString()
  refreshToken!: string
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password)
    const { accessToken, refreshToken } = await this.authService.login(user)
    return { accessToken, refreshToken }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('ไม่มี refresh token')
    }
    const { accessToken, refreshToken, user } = await this.authService.refresh(dto.refreshToken)
    return { accessToken, refreshToken, user }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'ออกจากระบบสำเร็จ' }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id)
  }
}
