-- AlterTable
ALTER TABLE "User" ADD COLUMN     "encryptedPrivatekey" TEXT,
ADD COLUMN     "hasRedeemed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "walletAddress" TEXT;
