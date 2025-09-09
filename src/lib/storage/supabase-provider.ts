import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageProvider, UploadResult, DeleteResult, FileItem, StorageError } from './types';

export class SupabaseStorageProvider implements StorageProvider {
  name = 'supabase';
  private client: SupabaseClient;
  private bucket: string;

  constructor(
    url: string,
    serviceRoleKey: string,
    bucket: string = 'lawyer-files'
  ) {
    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    this.bucket = bucket;
  }

  async upload(file: File, path: string): Promise<UploadResult> {
    try {
      // Конвертируем File в ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .upload(path, arrayBuffer, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        throw new StorageError(
          `Supabase upload error: ${error.message}`,
          'SUPABASE_UPLOAD_ERROR',
          this.name
        );
      }

      // Получаем публичный URL
      const { data: urlData } = this.client.storage
        .from(this.bucket)
        .getPublicUrl(path);

      return {
        success: true,
        path: data.path,
        url: urlData.publicUrl,
        size: file.size
      };
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        `Failed to upload to Supabase: ${message}`,
        'UPLOAD_ERROR',
        this.name
      );
    }
  }

  async delete(path: string): Promise<DeleteResult> {
    try {
      const { error } = await this.client.storage
        .from(this.bucket)
        .remove([path]);

      if (error) {
        throw new StorageError(
          `Supabase delete error: ${error.message}`,
          'SUPABASE_DELETE_ERROR',
          this.name
        );
      }

      return { success: true };
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        `Failed to delete from Supabase: ${message}`,
        'DELETE_ERROR',
        this.name
      );
    }
  }

  async getUrl(path: string): Promise<string> {
    try {
      const { data } = this.client.storage
        .from(this.bucket)
        .getPublicUrl(path);
      
      return data.publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        `Failed to get URL from Supabase: ${message}`,
        'GET_URL_ERROR',
        this.name
      );
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .download(path);

      // Если нет ошибки и есть данные - файл существует
      return !error && !!data;
    } catch {
      return false;
    }
  }

  async list(prefix: string = ''): Promise<FileItem[]> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .list(prefix, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        throw new StorageError(
          `Supabase list error: ${error.message}`,
          'SUPABASE_LIST_ERROR',
          this.name
        );
      }

      const fileItems: FileItem[] = data.map(item => {
        const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
        
        return {
          name: item.name,
          path: itemPath,
          size: item.metadata?.size || 0,
          lastModified: new Date(item.updated_at || item.created_at),
          isDirectory: !item.metadata, // Если нет метаданных, значит это папка
          url: item.metadata ? this.client.storage.from(this.bucket).getPublicUrl(itemPath).data.publicUrl : undefined
        };
      });

      return fileItems;
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        `Failed to list files from Supabase: ${message}`,
        'LIST_ERROR',
        this.name
      );
    }
  }
}
