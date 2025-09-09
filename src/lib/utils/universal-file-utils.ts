import { storage } from '../storage';
import { UploadResult, DeleteResult, FileItem } from '../storage/types';

// Универсальная функция загрузки файла
export async function uploadFile(
  file: File,
  path: string
): Promise<UploadResult> {
  try {
    const storageProvider = storage();
    console.log(`[Storage] Using ${storageProvider.name} provider for upload`);
    
    const result = await storageProvider.upload(file, path);
    
    console.log(`[Storage] Upload ${result.success ? 'successful' : 'failed'}:`, {
      provider: storageProvider.name,
      path: result.path,
      url: result.url,
      size: result.size
    });
    
    return result;
  } catch (error) {
    console.error('[Storage] Upload error:', error);
    throw error;
  }
}

// Универсальная функция удаления файла
export async function deleteFile(path: string): Promise<DeleteResult> {
  try {
    const storageProvider = storage();
    console.log(`[Storage] Using ${storageProvider.name} provider for delete`);
    
    const result = await storageProvider.delete(path);
    
    console.log(`[Storage] Delete ${result.success ? 'successful' : 'failed'}:`, {
      provider: storageProvider.name,
      path
    });
    
    return result;
  } catch (error) {
    console.error('[Storage] Delete error:', error);
    throw error;
  }
}

// Получение URL файла
export async function getFileUrl(path: string): Promise<string> {
  try {
    const storageProvider = storage();
    const url = await storageProvider.getUrl(path);
    
    console.log(`[Storage] Generated URL for ${path}:`, url);
    return url;
  } catch (error) {
    console.error('[Storage] Get URL error:', error);
    throw error;
  }
}

// Проверка существования файла
export async function fileExists(path: string): Promise<boolean> {
  try {
    const storageProvider = storage();
    const exists = await storageProvider.exists(path);
    
    console.log(`[Storage] File ${path} exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error('[Storage] File exists check error:', error);
    return false;
  }
}

// Список файлов в директории
export async function listFiles(prefix: string = ''): Promise<FileItem[]> {
  try {
    const storageProvider = storage();
    console.log(`[Storage] Using ${storageProvider.name} provider for listing files`);
    
    const files = await storageProvider.list(prefix);
    
    console.log(`[Storage] Listed ${files.length} files in "${prefix}"`);
    return files;
  } catch (error) {
    console.error('[Storage] List files error:', error);
    throw error;
  }
}

// Генерация уникального имени файла
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  
  return `${timestamp}_${randomString}.${extension}`;
}

// Создание пути для файла пользователя
export function createUserFilePath(userId: number, fileName: string): string {
  const uniqueFileName = generateUniqueFileName(fileName);
  return `user_${userId}/${uniqueFileName}`;
}

// Валидация типа файла
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// Валидация размера файла (в байтах)
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

// Получение информации о провайдере хранения
export function getStorageInfo() {
  const storageProvider = storage();
  const provider = process.env.STORAGE_PROVIDER || 'local';
  
  return {
    provider,
    providerName: storageProvider.name,
    isLocal: provider === 'local',
    isSupabase: provider === 'supabase'
  };
}
