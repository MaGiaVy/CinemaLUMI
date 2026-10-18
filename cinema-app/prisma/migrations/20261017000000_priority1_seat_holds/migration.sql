ALTER TABLE "seats"
  ADD COLUMN "hold_user_id" INTEGER,
  ADD COLUMN "hold_payment_id" INTEGER;

CREATE INDEX "seats_hold_payment_id_idx" ON "seats"("hold_payment_id");

ALTER TABLE "seats"
  ADD CONSTRAINT "seats_hold_user_id_fkey"
  FOREIGN KEY ("hold_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL;

ALTER TABLE "seats"
  ADD CONSTRAINT "seats_hold_payment_id_fkey"
  FOREIGN KEY ("hold_payment_id") REFERENCES "payments"("payment_id") ON DELETE SET NULL;
