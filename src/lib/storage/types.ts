// Абстрактный интерфейс для провайдеров хранения файлов
export interface StorageProvider {
  name: string;
  upload(file: File, path: string): Promise<UploadResult>;
  delete(path: string): Promise<DeleteResult>;
  getUrl(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
  list(prefix?: string): Promise<FileItem[]>;
}

// Результат загрузки файла
export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
  size?: number;
}

// Результат удаления файла
export interface DeleteResult {
  success: boolean;
  error?: string;
}

// Элемент файла в списке
export interface FileItem {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
  url?: string;
}

// Конфигурация провайдера
export interface StorageConfig {
  provider: 'local' | 'supabase';
  basePath?: string;
  bucket?: string;
}

// Типы ошибок хранения
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string
  ) {
    super(message);
    this.name = 'StorageError';
  }
}
