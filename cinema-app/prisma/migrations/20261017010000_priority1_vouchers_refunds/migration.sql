CREATE TYPE "RefundStatus" AS ENUM ('PENDING_REFUND', 'REFUNDED');

ALTER TABLE "coupons"
  ADD COLUMN "max_discount" DECIMAL(10,2),
  ADD COLUMN "source_ticket_id" INTEGER;
CREATE UNIQUE INDEX "coupons_source_ticket_id_key" ON "coupons"("source_ticket_id");
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_source_ticket_id_fkey"
  FOREIGN KEY ("source_ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE RESTRICT;

-- Liên kết voucher COMP50 lịch sử khi mã chứa đúng ticket ID hiện có.
WITH matched AS (
  SELECT c."coupon_id", t."ticket_id",
         row_number() OVER (PARTITION BY t."ticket_id" ORDER BY c."coupon_id") AS rn
  FROM "coupons" c JOIN "tickets" t
    ON c."code" ~ '^COMP50_[0-9]+_[0-9]+$'
   AND split_part(c."code", '_', 2)::INTEGER = t."ticket_id"
   AND c."user_id" = t."user_id"
)
UPDATE "coupons" c SET "source_ticket_id" = m."ticket_id"
FROM matched m WHERE c."coupon_id" = m."coupon_id" AND m.rn = 1;

ALTER TABLE "payments" ADD COLUMN "coupon_reserved" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "tickets"
  ADD COLUMN "original_price" DECIMAL(10,2),
  ADD COLUMN "discount_amount" DECIMAL(10,2),
  ADD COLUMN "paid_price" DECIMAL(10,2);

CREATE TABLE "ticket_refunds" (
  "refund_id" SERIAL PRIMARY KEY,
  "ticket_id" INTEGER NOT NULL UNIQUE,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING_REFUND',
  "reason" TEXT NOT NULL,
  "claim_deadline" TIMESTAMP(3),
  "confirmed_by_id" INTEGER,
  "confirmed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ticket_refunds_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE RESTRICT,
  CONSTRAINT "ticket_refunds_confirmed_by_id_fkey" FOREIGN KEY ("confirmed_by_id") REFERENCES "users"("user_id") ON DELETE SET NULL
);

CREATE TABLE "cancellation_actions" (
  "action_id" SERIAL PRIMARY KEY,
  "ticket_id" INTEGER NOT NULL,
  "actor_user_id" INTEGER,
  "action" VARCHAR(50) NOT NULL,
  "reason" TEXT NOT NULL,
  "resolution" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cancellation_actions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE RESTRICT,
  CONSTRAINT "cancellation_actions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL
);
CREATE INDEX "cancellation_actions_ticket_id_idx" ON "cancellation_actions"("ticket_id");
