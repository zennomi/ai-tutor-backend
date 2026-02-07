import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCurriculumTables1770443081939 implements MigrationInterface {
  name = 'CreateCurriculumTables1770443081939';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "format" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "PK_format_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "grade" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "PK_grade_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "textbook" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "grade_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "PK_textbook_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_textbook_grade_id" ON "textbook" ("grade_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "unit" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "textbook_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "PK_unit_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_unit_textbook_id" ON "unit" ("textbook_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "lesson" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "unit_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "PK_lesson_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_lesson_unit_id" ON "lesson" ("unit_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "exercise" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "lesson_id" uuid NOT NULL,
                "format_id" uuid NOT NULL,
                "type_id" uuid,
                "question" text NOT NULL,
                "solution" text NOT NULL,
                "key" text NOT NULL,
                "has_image" boolean NOT NULL DEFAULT false,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "PK_exercise_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "exercise_type" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "lesson_id" uuid,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "PK_exercise_type_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_exercise_type_lesson_id" ON "exercise_type" ("lesson_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "textbook"
            ADD CONSTRAINT "FK_textbook_grade_id" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "unit"
            ADD CONSTRAINT "FK_unit_textbook_id" FOREIGN KEY ("textbook_id") REFERENCES "textbook"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "lesson"
            ADD CONSTRAINT "FK_lesson_unit_id" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "exercise"
            ADD CONSTRAINT "FK_exercise_lesson_id" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "exercise"
            ADD CONSTRAINT "FK_exercise_format_id" FOREIGN KEY ("format_id") REFERENCES "format"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "exercise"
            ADD CONSTRAINT "FK_exercise_type_id" FOREIGN KEY ("type_id") REFERENCES "exercise_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "exercise_type"
            ADD CONSTRAINT "FK_exercise_type_lesson_id" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "exercise_type" DROP CONSTRAINT "FK_exercise_type_lesson_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "exercise" DROP CONSTRAINT "FK_exercise_type_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "exercise" DROP CONSTRAINT "FK_exercise_format_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "exercise" DROP CONSTRAINT "FK_exercise_lesson_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "lesson" DROP CONSTRAINT "FK_lesson_unit_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "unit" DROP CONSTRAINT "FK_unit_textbook_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "textbook" DROP CONSTRAINT "FK_textbook_grade_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_exercise_type_lesson_id"
        `);
    await queryRunner.query(`
            DROP TABLE "exercise_type"
        `);
    await queryRunner.query(`
            DROP TABLE "exercise"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_lesson_unit_id"
        `);
    await queryRunner.query(`
            DROP TABLE "lesson"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_unit_textbook_id"
        `);
    await queryRunner.query(`
            DROP TABLE "unit"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_textbook_grade_id"
        `);
    await queryRunner.query(`
            DROP TABLE "textbook"
        `);
    await queryRunner.query(`
            DROP TABLE "grade"
        `);
    await queryRunner.query(`
            DROP TABLE "format"
        `);
  }
}
