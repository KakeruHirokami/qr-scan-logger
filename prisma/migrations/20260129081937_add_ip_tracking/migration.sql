-- CreateTable
CREATE TABLE "Visit" (
    "id" SERIAL NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitDate" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_visitedAt_idx" ON "Visit"("visitedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_ipAddress_visitDate_key" ON "Visit"("ipAddress", "visitDate");
