-- SQL скрипт для инициализации виртуальных полей
-- Выполните после миграции

-- Генерируем виртуальные ID для папок
UPDATE Folder 
SET virtualId = lower(hex(randomblob(12))),
    virtualPath = '/' || name
WHERE virtualId IS NULL;

-- Генерируем виртуальные ID для файлов  
UPDATE File
SET virtualId = lower(hex(randomblob(12))),
    virtualPath = COALESCE(
      (SELECT '/' || name FROM Folder WHERE Folder.id = File.folderId), 
      '/'
    )
WHERE virtualId IS NULL;
