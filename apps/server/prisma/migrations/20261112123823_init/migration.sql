-- CreateEnum
CREATE TYPE "GameSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED', 'REJECTED', 'ABANDONED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "totalStars" INTEGER NOT NULL DEFAULT 0,
    "totalLevelsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalCoinsEarned" INTEGER NOT NULL DEFAULT 0,
    "totalCustomersServed" INTEGER NOT NULL DEFAULT 0,
    "totalCustomersLost" INTEGER NOT NULL DEFAULT 0,
    "totalGamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "bestCombo" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unlockRequirement" INTEGER NOT NULL DEFAULT 0,
    "playable" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRestaurant" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerRestaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "levelNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "revenueTarget" INTEGER NOT NULL,
    "targetTwoStar" INTEGER NOT NULL,
    "targetThreeStar" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "customers" INTEGER NOT NULL,
    "config" JSONB NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerLevelProgress" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "bestStars" INTEGER NOT NULL DEFAULT 0,
    "bestRevenue" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerLevelProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantUpgrade" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "upgradeType" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "RestaurantUpgrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerUpgrade" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "upgradeType" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerUpgrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "seed" BIGINT NOT NULL,
    "upgradesSnapshot" JSONB NOT NULL,
    "status" "GameSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "revenue" INTEGER,
    "stars" INTEGER,
    "coinsAwarded" INTEGER,
    "result" JSONB,
    "rejectReason" TEXT,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_userId_key" ON "PlayerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRestaurant_playerId_restaurantId_key" ON "PlayerRestaurant"("playerId", "restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "Level_restaurantId_levelNumber_key" ON "Level"("restaurantId", "levelNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerLevelProgress_playerId_levelId_key" ON "PlayerLevelProgress"("playerId", "levelId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantUpgrade_restaurantId_upgradeType_level_key" ON "RestaurantUpgrade"("restaurantId", "upgradeType", "level");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerUpgrade_playerId_restaurantId_upgradeType_key" ON "PlayerUpgrade"("playerId", "restaurantId", "upgradeType");

-- CreateIndex
CREATE INDEX "GameSession_playerId_status_idx" ON "GameSession"("playerId", "status");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRestaurant" ADD CONSTRAINT "PlayerRestaurant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRestaurant" ADD CONSTRAINT "PlayerRestaurant_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerLevelProgress" ADD CONSTRAINT "PlayerLevelProgress_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerLevelProgress" ADD CONSTRAINT "PlayerLevelProgress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantUpgrade" ADD CONSTRAINT "RestaurantUpgrade_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerUpgrade" ADD CONSTRAINT "PlayerUpgrade_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerUpgrade" ADD CONSTRAINT "PlayerUpgrade_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
