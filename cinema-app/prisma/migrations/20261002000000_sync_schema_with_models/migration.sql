-- Keep the deployed database aligned with prisma/schema.prisma.

-- CreateEnum
CREATE TYPE "ScreeningStatus" AS ENUM ('UPCOMING', 'SHOWING', 'ENDED');

-- Add columns introduced after the initial migration.
ALTER TABLE "movies"
ADD COLUMN "end_date" DATE;

ALTER TABLE "screenings"
ADD COLUMN "room_number" INTEGER,
ADD COLUMN "status" "ScreeningStatus" NOT NULL DEFAULT 'UPCOMING';

ALTER TABLE "seats"
ALTER COLUMN "room" DROP NOT NULL,
ADD COLUMN "screening_id" INTEGER,
ADD COLUMN "status" "SeatStatus" NOT NULL DEFAULT 'EMPTY',
ADD COLUMN "reserved_until" TIMESTAMP(3);

ALTER TABLE "payments"
ADD COLUMN "screening_id" INTEGER,
ADD COLUMN "seat_ids" JSONB,
ADD COLUMN "coupon_code" VARCHAR(50),
ADD COLUMN "ticket_items" JSONB;

ALTER TABLE "tickets"
ALTER COLUMN "screening_id" DROP NOT NULL,
ALTER COLUMN "seat_id" DROP NOT NULL;

ALTER TABLE "combos"
ADD COLUMN "reserved_until" TIMESTAMP(3);

-- Replace constraints whose behavior changed in the current Prisma schema.
DROP INDEX "seats_room_row_number_key";
CREATE UNIQUE INDEX "seats_screening_id_code_key" ON "seats"("screening_id", "code");

DROP INDEX "tickets_screening_id_seat_id_key";
CREATE INDEX "tickets_screening_id_seat_id_idx" ON "tickets"("screening_id", "seat_id");

ALTER TABLE "tickets" DROP CONSTRAINT "tickets_screening_id_fkey";
ALTER TABLE "tickets"
ADD CONSTRAINT "tickets_screening_id_fkey"
FOREIGN KEY ("screening_id") REFERENCES "screenings"("screening_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tickets" DROP CONSTRAINT "tickets_seat_id_fkey";
ALTER TABLE "tickets"
ADD CONSTRAINT "tickets_seat_id_fkey"
FOREIGN KEY ("seat_id") REFERENCES "seats"("seat_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "seats"
ADD CONSTRAINT "seats_screening_id_fkey"
FOREIGN KEY ("screening_id") REFERENCES "screenings"("screening_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add the combo reservation model.
CREATE TABLE "combo_reservations" (
    "reservation_id" SERIAL NOT NULL,
    "combo_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
    "reserved_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combo_reservations_pkey" PRIMARY KEY ("reservation_id")
);

ALTER TABLE "combo_reservations"
ADD CONSTRAINT "combo_reservations_combo_id_fkey"
FOREIGN KEY ("combo_id") REFERENCES "combos"("combo_id") ON DELETE CASCADE ON UPDATE CASCADE;