/*
  Warnings:

  - A unique constraint covering the columns `[virtualId]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Folder" ADD COLUMN "virtualId" TEXT;
ALTER TABLE "Folder" ADD COLUMN "virtualPath" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "virtualPath" TEXT NOT NULL DEFAULT '',
    "virtualId" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy" INTEGER NOT NULL,
    "folderId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "File_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_File" ("createdAt", "filename", "folderId", "id", "mimeType", "originalName", "path", "size", "uploadedBy") SELECT "createdAt", "filename", "folderId", "id", "mimeType", "originalName", "path", "size", "uploadedBy" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
CREATE UNIQUE INDEX "File_filename_key" ON "File"("filename");
CREATE UNIQUE INDEX "File_virtualId_key" ON "File"("virtualId");
CREATE INDEX "File_uploadedBy_idx" ON "File"("uploadedBy");
CREATE INDEX "File_virtualPath_idx" ON "File"("virtualPath");
CREATE INDEX "File_virtualId_idx" ON "File"("virtualId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Folder_virtualId_key" ON "Folder"("virtualId");

-- CreateIndex
CREATE INDEX "Folder_virtualPath_idx" ON "Folder"("virtualPath");

-- CreateIndex
CREATE INDEX "Folder_virtualId_idx" ON "Folder"("virtualId");
