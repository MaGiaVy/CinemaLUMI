-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "MovieStatus" AS ENUM ('SHOWING', 'UPCOMING', 'ENDED');

-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('STANDARD', 'VIP', 'COUPLE');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('EMPTY', 'RESERVED', 'OCCUPIED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('Percentage', 'FixedAmount');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VNPay', 'Momo', 'Cash', 'BankCard');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Success', 'Failed', 'Refunded');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('Valid', 'Used', 'Cancelled');

-- CreateEnum
CREATE TYPE "ComboStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "movies" (
    "movie_id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255),
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "release_date" DATE NOT NULL,
    "poster" VARCHAR(500) NOT NULL,
    "trailer" VARCHAR(500),
    "rating" DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    "genre" VARCHAR(100) NOT NULL,
    "director" VARCHAR(100),
    "cast" TEXT,
    "status" "MovieStatus" NOT NULL DEFAULT 'SHOWING',
    "ticket_price" DECIMAL(10,2) NOT NULL DEFAULT 120000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("movie_id")
);

-- CreateTable
CREATE TABLE "screenings" (
    "screening_id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "room" VARCHAR(50) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "date" DATE NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screenings_pkey" PRIMARY KEY ("screening_id")
);

-- CreateTable
CREATE TABLE "seats" (
    "seat_id" SERIAL NOT NULL,
    "room" VARCHAR(50) NOT NULL,
    "row" VARCHAR(5) NOT NULL,
    "number" INTEGER NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "type" "SeatType" NOT NULL DEFAULT 'STANDARD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("seat_id")
);

-- CreateTable
CREATE TABLE "pricing" (
    "pricing_id" SERIAL NOT NULL,
    "ticket_type" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "percentage" INTEGER NOT NULL DEFAULT 100,
    "base_price" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_pkey" PRIMARY KEY ("pricing_id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "coupon_id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_usage" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expiry_date" DATE NOT NULL,
    "applicable_movie_id" INTEGER,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("coupon_id")
);

-- CreateTable
CREATE TABLE "combos" (
    "combo_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "image" VARCHAR(500),
    "stock" INTEGER NOT NULL DEFAULT 100,
    "status" "ComboStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combos_pkey" PRIMARY KEY ("combo_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod",
    "transaction_code" VARCHAR(100),
    "status" "PaymentStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "ticket_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "screening_id" INTEGER NOT NULL,
    "seat_id" INTEGER NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "ticket_type" VARCHAR(50) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TicketStatus" NOT NULL DEFAULT 'Valid',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateTable
CREATE TABLE "order_combos" (
    "order_combo_id" SERIAL NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "combo_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_combos_pkey" PRIMARY KEY ("order_combo_id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "review_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "movies_slug_key" ON "movies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "seats_room_row_number_key" ON "seats"("room", "row", "number");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_ticket_type_key" ON "pricing"("ticket_type");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_screening_id_seat_id_key" ON "tickets"("screening_id", "seat_id");

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("movie_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_applicable_movie_id_fkey" FOREIGN KEY ("applicable_movie_id") REFERENCES "movies"("movie_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_screening_id_fkey" FOREIGN KEY ("screening_id") REFERENCES "screenings"("screening_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("seat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_combos" ADD CONSTRAINT "order_combos_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_combos" ADD CONSTRAINT "order_combos_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("combo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("movie_id") ON DELETE CASCADE ON UPDATE CASCADE;
