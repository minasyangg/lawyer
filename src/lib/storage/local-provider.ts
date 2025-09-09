import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { StorageProvider, UploadResult, DeleteResult, FileItem, StorageError } from './types';

export class LocalStorageProvider implements StorageProvider {
  name = 'local';
  private basePath: string;

  constructor(basePath: string = './public/uploads') {
    this.basePath = basePath;
  }

  async upload(file: File, path: string): Promise<UploadResult> {
    try {
      const fullPath = join(this.basePath, path);
      const directory = dirname(fullPath);

      // Создаем директорию если её нет
      await fs.mkdir(directory, { recursive: true });

      // Конвертируем File в Buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Записываем файл
      await fs.writeFile(fullPath, buffer);

      // Генерируем URL для доступа
      const url = `/uploads/${path}`;

      return {
        success: true,
        path,
        url,
        size: file.size
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        `Failed to upload file: ${message}`,
        'UPLOAD_ERROR',
        this.name
      );
    }
  }

  async delete(path: string): Promise<DeleteResult> {
    try {
      const fullPath = join(this.basePath, path);
      await fs.unlink(fullPath);
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        `Failed to delete file: ${message}`,
        'DELETE_ERROR',
        this.name
      );
    }
  }

  async getUrl(path: string): Promise<string> {
    return `/uploads/${path}`;
  }

  async exists(path: string): Promise<boolean> {
    try {
      const fullPath = join(this.basePath, path);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix: string = ''): Promise<FileItem[]> {
    try {
      const fullPath = join(this.basePath, prefix);
      const items = await fs.readdir(fullPath, { withFileTypes: true });
      
      const fileItems: FileItem[] = [];
      
      for (const item of items) {
        const itemPath = join(prefix, item.name);
        const stats = await fs.stat(join(this.basePath, itemPath));
        
        fileItems.push({
          name: item.name,
          path: itemPath,
          size: stats.size,
          lastModified: stats.mtime,
          isDirectory: item.isDirectory(),
          url: item.isFile() ? `/uploads/${itemPath}` : undefined
        });
      }
      
      return fileItems;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        `Failed to list files: ${message}`,
        'LIST_ERROR',
        this.name
      );
    }
  }
}
