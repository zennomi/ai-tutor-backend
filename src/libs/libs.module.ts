import { Module } from '@nestjs/common';
import { AwsModule } from './aws/aws.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { GcpModule } from './gcp/gcp.module';

@Module({
  imports: [AwsModule, EmbeddingModule, GcpModule],
  exports: [AwsModule, EmbeddingModule, GcpModule],
})
export class LibsModule {}
