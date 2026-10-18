-- Keep historical reservations and payments; ownership is required only for new online holds.
ALTER TABLE "combo_reservations" ADD COLUMN "user_id" INTEGER, ADD COLUMN "payment_id" INTEGER;
ALTER TABLE "payments" ADD COLUMN "sold_by_id" INTEGER;
ALTER TABLE "order_combos" ADD COLUMN "reservation_id" INTEGER;

CREATE INDEX "combo_reservations_user_id_status_idx" ON "combo_reservations"("user_id", "status");
CREATE INDEX "combo_reservations_payment_id_idx" ON "combo_reservations"("payment_id");
CREATE UNIQUE INDEX "order_combos_reservation_id_key" ON "order_combos"("reservation_id");
CREATE UNIQUE INDEX "reviews_user_id_movie_id_key" ON "reviews"("user_id", "movie_id");

ALTER TABLE "combo_reservations" ADD CONSTRAINT "combo_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL;
ALTER TABLE "combo_reservations" ADD CONSTRAINT "combo_reservations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE SET NULL;
ALTER TABLE "payments" ADD CONSTRAINT "payments_sold_by_id_fkey" FOREIGN KEY ("sold_by_id") REFERENCES "users"("user_id") ON DELETE SET NULL;
ALTER TABLE "order_combos" ADD CONSTRAINT "order_combos_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "combo_reservations"("reservation_id") ON DELETE SET NULL;
