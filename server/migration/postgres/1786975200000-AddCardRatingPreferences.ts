import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardRatingPreferences1786975200000 implements MigrationInterface {
  name = 'AddCardRatingPreferences1786975200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "showCardRatings" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "cardRatingProvider" character varying NOT NULL DEFAULT 'tmdb'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "cardRatingProvider"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "showCardRatings"`
    );
  }
}
