-- AlterTable
ALTER TABLE "public"."File" ADD COLUMN     "isProtected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Folder" ADD COLUMN     "isProtected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."ArticleFile" (
    "articleId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleFile_pkey" PRIMARY KEY ("articleId","fileId")
);

-- CreateIndex
CREATE INDEX "ArticleFile_articleId_idx" ON "public"."ArticleFile"("articleId");

-- CreateIndex
CREATE INDEX "ArticleFile_fileId_idx" ON "public"."ArticleFile"("fileId");

-- CreateIndex
CREATE INDEX "File_isPublic_idx" ON "public"."File"("isPublic");

-- CreateIndex
CREATE INDEX "File_isProtected_idx" ON "public"."File"("isProtected");

-- CreateIndex
CREATE INDEX "Folder_isPublic_idx" ON "public"."Folder"("isPublic");

-- CreateIndex
CREATE INDEX "Folder_isProtected_idx" ON "public"."Folder"("isProtected");

-- AddForeignKey
ALTER TABLE "public"."ArticleFile" ADD CONSTRAINT "ArticleFile_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArticleFile" ADD CONSTRAINT "ArticleFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
