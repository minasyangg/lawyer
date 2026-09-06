-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "siteName" TEXT NOT NULL DEFAULT 'ПФК',
    "contactEmail" TEXT NOT NULL DEFAULT 'info@pfc.moscow',
    "notifyNewArticles" BOOLEAN NOT NULL DEFAULT false,
    "notifyLoginAlerts" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" INTEGER,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Единственная строка-синглтон с настройками по умолчанию
INSERT INTO "SiteSettings" ("id", "siteName", "contactEmail", "notifyNewArticles", "notifyLoginAlerts", "updatedAt")
VALUES (1, 'ПФК', 'info@pfc.moscow', false, true, now());
