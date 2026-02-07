import type { AllConfigType } from '@/config/config.type';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

export interface EmbeddingResult {
  embedding: number[];
  promptTokens?: number;
  totalTokens?: number;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly httpService: HttpService,
  ) {}

  async embed(
    text: string | undefined | null,
  ): Promise<EmbeddingResult | null> {
    if (!text || !text.trim()) {
      return null;
    }

    const apiUrl = this.configService.get('embedding.apiUrl', {
      infer: true,
    });
    const apiKey = this.configService.get('embedding.apiKey', { infer: true });
    const model = this.configService.get('embedding.model', {
      infer: true,
    });
    const dimension = this.configService.get('embedding.dimension', {
      infer: true,
    });

    if (!apiUrl || !model) {
      this.logger.warn(
        'Embedding service is not configured (missing apiUrl or model)',
      );
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          apiUrl,
          {
            model,
            input: text,
          },
          {
            headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
          },
        ),
      );

      const embedding =
        (response.data?.data?.[0]?.embedding as number[] | undefined) ?? null;

      if (!embedding) {
        this.logger.warn('Embedding response missing embedding array');
        return null;
      }

      if (dimension && embedding.length !== dimension) {
        this.logger.warn(
          `Embedding dimension mismatch: expected ${dimension}, got ${embedding.length}`,
        );
      }

      const promptTokens = response.data?.usage?.prompt_tokens;
      const totalTokens = response.data?.usage?.total_tokens;

      return {
        embedding,
        promptTokens:
          typeof promptTokens === 'number' ? promptTokens : undefined,
        totalTokens: typeof totalTokens === 'number' ? totalTokens : undefined,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to generate embedding: ${axiosError.message ?? 'unknown error'}`,
        axiosError.stack,
      );
      return null;
    }
  }
}
