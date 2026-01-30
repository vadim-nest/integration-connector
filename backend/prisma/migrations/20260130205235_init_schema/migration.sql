-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncSource" AS ENUM ('FILE', 'API');

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "hourlyRateCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "employeeExternalId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "workMinutes" INTEGER NOT NULL,
    "earningsCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" SERIAL NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "SyncStatus" NOT NULL,
    "source" "SyncSource" NOT NULL,
    "recordsRead" INTEGER NOT NULL DEFAULT 0,
    "recordsInserted" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsErrored" INTEGER NOT NULL DEFAULT 0,
    "errorLog" JSONB,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_externalId_key" ON "Employee"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_externalId_key" ON "Shift"("externalId");

-- CreateIndex
CREATE INDEX "Shift_startAt_idx" ON "Shift"("startAt");

-- CreateIndex
CREATE INDEX "Shift_employeeExternalId_idx" ON "Shift"("employeeExternalId");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_employeeExternalId_fkey" FOREIGN KEY ("employeeExternalId") REFERENCES "Employee"("externalId") ON DELETE RESTRICT ON UPDATE CASCADE;
