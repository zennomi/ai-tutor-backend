import validateConfig from '@/utils/validate-config';
import { registerAs } from '@nestjs/config';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';
import process from 'node:process';
import { EmbeddingConfig } from './embedding-config.type';

const DEFAULT_EMBEDDING_API_URL = 'https://api.openai.com/v1/embeddings';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
const DEFAULT_EMBEDDING_DIMENSION = 1536;

class EnvironmentVariablesValidator {
  @IsUrl({ require_tld: false })
  @IsOptional()
  EMBEDDING_API_URL: string;

  @IsString()
  @IsOptional()
  EMBEDDING_API_KEY: string;

  @IsString()
  @IsOptional()
  EMBEDDING_MODEL: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  EMBEDDING_DIMENSION: number;
}

export default registerAs<EmbeddingConfig>('embedding', () => {
  console.info(`Register EmbeddingConfig from environment variables`);
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    apiUrl: process.env.EMBEDDING_API_URL || DEFAULT_EMBEDDING_API_URL,
    apiKey: process.env.EMBEDDING_API_KEY || null,
    model: process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    dimension: process.env.EMBEDDING_DIMENSION
      ? parseInt(process.env.EMBEDDING_DIMENSION, 10)
      : DEFAULT_EMBEDDING_DIMENSION,
  };
});
