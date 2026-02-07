import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionEmbedding1770700000000 implements MigrationInterface {
  name = 'AddQuestionEmbedding1770700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "vector"');
    await queryRunner.query(
      'ALTER TABLE "exercise" ADD COLUMN IF NOT EXISTS "question_embedding" vector(1536)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_exercise_question_embedding" ON "exercise" USING ivfflat ("question_embedding" vector_l2_ops) WITH (lists = 100)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_exercise_question_embedding"',
    );
    await queryRunner.query(
      'ALTER TABLE "exercise" DROP COLUMN IF EXISTS "question_embedding"',
    );
  }
}
