import { StorageProvider, StorageConfig } from './types';
import { LocalStorageProvider } from './local-provider';
import { SupabaseStorageProvider } from './supabase-provider';

export class StorageFactory {
  private static instance: StorageProvider | null = null;

  static getProvider(config?: StorageConfig): StorageProvider {
    // Если провайдер уже создан и конфигурация не изменилась, возвращаем существующий
    if (this.instance) {
      return this.instance;
    }

    const storageProvider = config?.provider || process.env.STORAGE_PROVIDER || 'local';

    switch (storageProvider) {
      case 'supabase':
        return this.createSupabaseProvider(config);
      case 'local':
      default:
        return this.createLocalProvider(config);
    }
  }

  private static createLocalProvider(config?: StorageConfig): StorageProvider {
    const basePath = config?.basePath || './public/uploads';
    this.instance = new LocalStorageProvider(basePath);
    return this.instance;
  }

  private static createSupabaseProvider(config?: StorageConfig): StorageProvider {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = config?.bucket || process.env.STORAGE_BUCKET_SUPABASE || 'lawyer-files';

    if (!url || !serviceRoleKey) {
      throw new Error(
        'Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
      );
    }

    this.instance = new SupabaseStorageProvider(url, serviceRoleKey, bucket);
    return this.instance;
  }

  // Сброс кэшированного провайдера (полезно для тестов)
  static reset(): void {
    this.instance = null;
  }

  // Проверка доступности провайдера
  static async validateProvider(provider: 'local' | 'supabase'): Promise<boolean> {
    try {
      const config: StorageConfig = { provider };
      const storageProvider = this.getProvider(config);
      
      // Попытка проверить подключение через список файлов
      await storageProvider.list('');
      return true;
    } catch (error) {
      console.error(`Storage provider ${provider} validation failed:`, error);
      return false;
    }
  }
}

// Экспорт для удобного использования
export const storage = () => StorageFactory.getProvider();
