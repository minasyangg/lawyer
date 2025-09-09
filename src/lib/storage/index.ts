// Экспорт всех компонентов модуля хранения
export * from './types';
export * from './local-provider';
export * from './supabase-provider';
export * from './factory';

// Основные функции для работы с хранилищем
export { storage, StorageFactory } from './factory';
export type { 
  StorageProvider, 
  UploadResult, 
  DeleteResult, 
  FileItem, 
  StorageConfig 
} from './types';
export { StorageError } from './types';
