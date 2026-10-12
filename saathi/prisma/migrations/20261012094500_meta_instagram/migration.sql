-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "igUserId" TEXT,
ADD COLUMN     "metaTokenEnc" TEXT,
ADD COLUMN     "metaTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "instagramConnectedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Shop_igUserId_idx" ON "Shop"("igUserId");

-- AlterTable
ALTER TABLE "IgPost" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "mediaUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "IgPost_shopId_externalId_key" ON "IgPost"("shopId", "externalId");

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "buyerIgsid" TEXT,
ADD COLUMN     "windowOpenedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Conversation_shopId_buyerIgsid_idx" ON "Conversation"("shopId", "buyerIgsid");

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE INDEX "Message_externalId_idx" ON "Message"("externalId");

-- AlterTable
ALTER TABLE "IgComment" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "authorIgsid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "IgComment_externalId_key" ON "IgComment"("externalId");

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventKey_key" ON "WebhookEvent"("eventKey");
