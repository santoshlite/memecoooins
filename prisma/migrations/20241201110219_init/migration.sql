-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "portfolio" JSONB DEFAULT '[]',
    "netWorthHistory" JSONB DEFAULT '[]',
    "lastNetWorthUpdate" TIMESTAMP(3),
    "portfolioCreatedAt" TIMESTAMP(3),
    "encryptedPrivatekey" TEXT,
    "hasRedeemed" BOOLEAN NOT NULL DEFAULT false,
    "walletAddress" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coin" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "solana_contract_address" TEXT NOT NULL,
    "current_price" DOUBLE PRECISION,
    "last_price_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Coin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
