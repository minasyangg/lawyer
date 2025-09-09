import { StorageFactory } from '../lib/storage/factory';
import { getStorageInfo } from '../lib/utils/universal-file-utils';

// Функция для тестирования подключения к хранилищу
export async function testStorageConnection() {
  try {
    console.log('🧪 Starting storage connection test...');
    
    // Получаем информацию о текущем провайдере
    const storageInfo = getStorageInfo();
    console.log('📦 Storage Info:', storageInfo);
    
    // Получаем провайдер хранения
    const provider = StorageFactory.getProvider();
    console.log(`🔗 Using provider: ${provider.name}`);
    
    // Проверяем подключение через список файлов
    console.log('📋 Testing connection by listing root files...');
    const files = await provider.list('');
    console.log(`✅ Connection successful! Found ${files.length} items in root`);
    
    // Выводим первые несколько файлов для проверки
    if (files.length > 0) {
      console.log('📁 First few items:');
      files.slice(0, 5).forEach(file => {
        console.log(`  - ${file.name} (${file.isDirectory ? 'folder' : 'file'}) - ${file.size} bytes`);
      });
    }
    
    return {
      success: true,
      provider: provider.name,
      filesCount: files.length,
      message: 'Storage connection test passed!'
    };
    
  } catch (error) {
    console.error('❌ Storage connection test failed:', error);
    
    return {
      success: false,
      provider: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Storage connection test failed!'
    };
  }
}

// Функция для создания тестового файла
export async function uploadTestFile() {
  try {
    console.log('📤 Starting test file upload...');
    
    // Создаем простой тестовый файл
    const testContent = `Test file created at: ${new Date().toISOString()}\nStorage provider: ${getStorageInfo().provider}`;
    const testFile = new File([testContent], 'test-connection.txt', { type: 'text/plain' });
    const testPath = `test/connection-test-${Date.now()}.txt`;
    
    const provider = StorageFactory.getProvider();
    console.log(`📤 Uploading test file using ${provider.name} provider...`);
    
    const result = await provider.upload(testFile, testPath);
    
    if (result.success) {
      console.log('✅ Test file uploaded successfully!');
      console.log('📍 File path:', result.path);
      console.log('🌐 File URL:', result.url);
      
      // Проверяем, что файл действительно существует
      const exists = await provider.exists(testPath);
      console.log('🔍 File exists check:', exists);
      
      return {
        success: true,
        path: result.path,
        url: result.url,
        size: result.size,
        provider: provider.name,
        message: 'Test file uploaded successfully!'
      };
    } else {
      throw new Error(result.error || 'Upload failed');
    }
    
  } catch (error) {
    console.error('❌ Test file upload failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Test file upload failed!'
    };
  }
}

// Функция для полного тестирования хранилища
export async function runFullStorageTest() {
  console.log('🚀 Running full storage test suite...');
  console.log('=' .repeat(50));
  
  // Тест подключения
  const connectionTest = await testStorageConnection();
  console.log('\n📋 Connection Test Result:', connectionTest);
  
  // Тест загрузки файла
  const uploadTest = await uploadTestFile();
  console.log('\n📤 Upload Test Result:', uploadTest);
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Storage test suite completed!');
  
  return {
    connection: connectionTest,
    upload: uploadTest,
    overall: connectionTest.success && uploadTest.success
  };
}
