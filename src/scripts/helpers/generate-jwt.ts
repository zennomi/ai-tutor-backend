import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { Uuid } from '@/common/types/common.type';

import { AuthService } from '@/api/auth/auth.service';
import { AppModule } from '../../app.module';

async function bootstrap() {
  // Get user UUID from command line arguments
  const userUuid = process.argv[2];

  if (!userUuid) {
    console.error('Error: User UUID is required');
    console.error('Usage: pnpm jwt:generate <user-uuid>');
    process.exit(1);
  }

  // Validate UUID format (basic check)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userUuid)) {
    console.error('Error: Invalid UUID format');
    process.exit(1);
  }

  // Bootstrap NestJS application
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false, // Disable logger for cleaner output
  });

  try {
    // Get required services
    const authService = app.get<AuthService>(AuthService);

    // Login as user
    const { accessToken } = await authService.getUserJwt(userUuid as Uuid);

    // Output access token
    console.log(accessToken);

    // Cleanup
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Error generating access token:', error);
    await app.close();
    process.exit(1);
  }
}

void bootstrap();
