-- CreateEnum
CREATE TYPE "public"."ScreeningStatus" AS ENUM ('UPCOMING', 'SHOWING', 'ENDED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."tickets" DROP CONSTRAINT "tickets_screening_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tickets" DROP CONSTRAINT "tickets_seat_id_fkey";

-- DropIndex
DROP INDEX "public"."seats_room_row_number_key";

-- DropIndex
DROP INDEX "public"."tickets_screening_id_seat_id_key";

-- AlterTable
ALTER TABLE "public"."combos" ADD COLUMN     "reserved_until" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."movies" ADD COLUMN     "age_rating" VARCHAR(20),
ADD COLUMN     "end_date" DATE,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."order_combos" ADD COLUMN     "delivered_at" TIMESTAMP(3),
ADD COLUMN     "is_delivered" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "coupon_code" VARCHAR(50),
ADD COLUMN     "screening_id" INTEGER,
ADD COLUMN     "seat_ids" JSONB,
ADD COLUMN     "ticket_items" JSONB;

-- AlterTable
ALTER TABLE "public"."screenings" ADD COLUMN     "room_number" INTEGER,
ADD COLUMN     "status" "public"."ScreeningStatus" NOT NULL DEFAULT 'UPCOMING';

-- AlterTable
ALTER TABLE "public"."seats" ADD COLUMN     "reserved_until" TIMESTAMP(3),
ADD COLUMN     "reserved_user_id" INTEGER,
ADD COLUMN     "screening_id" INTEGER,
ADD COLUMN     "status" "public"."SeatStatus" NOT NULL DEFAULT 'EMPTY',
ALTER COLUMN "room" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."tickets" ADD COLUMN     "cancellation_reason" TEXT,
ALTER COLUMN "screening_id" DROP NOT NULL,
ALTER COLUMN "seat_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."combo_reservations" (
    "reservation_id" SERIAL NOT NULL,
    "combo_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
    "reserved_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combo_reservations_pkey" PRIMARY KEY ("reservation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seats_screening_id_code_key" ON "public"."seats"("screening_id" ASC, "code" ASC);

-- CreateIndex
CREATE INDEX "tickets_screening_id_seat_id_idx" ON "public"."tickets"("screening_id" ASC, "seat_id" ASC);

-- AddForeignKey
ALTER TABLE "public"."combo_reservations" ADD CONSTRAINT "combo_reservations_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "public"."combos"("combo_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seats" ADD CONSTRAINT "seats_reserved_user_id_fkey" FOREIGN KEY ("reserved_user_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."seats" ADD CONSTRAINT "seats_screening_id_fkey" FOREIGN KEY ("screening_id") REFERENCES "public"."screenings"("screening_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_screening_id_fkey" FOREIGN KEY ("screening_id") REFERENCES "public"."screenings"("screening_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("seat_id") ON DELETE SET NULL ON UPDATE CASCADE;
