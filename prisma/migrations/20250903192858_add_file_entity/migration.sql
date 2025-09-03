-- CreateTable
CREATE TABLE "FileEntity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isFolder" BOOLEAN NOT NULL,
    "parentId" INTEGER,
    "path" TEXT,
    "size" INTEGER,
    "mimeType" TEXT,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FileEntity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FileEntity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FileEntity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
