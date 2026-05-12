import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser')
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

process.env.TZ = 'Asia/Bangkok'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(cookieParser())

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  app.useGlobalFilters(new HttpExceptionFilter())

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`🚀 API running on http://localhost:${port}`)
}

bootstrap()
