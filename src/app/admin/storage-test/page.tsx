'use client';

import { useState } from 'react';

export default function StorageTestPage() {
  const [testResults, setTestResults] = useState<{
    success: boolean;
    error?: string;
    result?: Record<string, unknown>;
    testType?: string;
    timestamp?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [storageProvider, setStorageProvider] = useState('local');

  const runTest = async (testType: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test-storage?type=${testType}`);
      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const switchProvider = async () => {
    const newProvider = storageProvider === 'local' ? 'supabase' : 'local';
    
    try {
      // Сначала сбрасываем кэш провайдера
      await fetch('/api/test-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-provider' })
      });
      
      setStorageProvider(newProvider);
      setTestResults(null);
      
      alert(`Переключено на ${newProvider} провайдер. Перезапустите сервер для применения изменений в STORAGE_PROVIDER.`);
    } catch (error) {
      console.error('Error switching provider:', error);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">🧪 Тестирование системы хранения</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Текущий провайдер: {storageProvider}</h2>
        <button
          onClick={switchProvider}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Переключить на {storageProvider === 'local' ? 'Supabase' : 'Local'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => runTest('connection')}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 disabled:opacity-50"
        >
          🔗 Тест подключения
        </button>
        
        <button
          onClick={() => runTest('upload')}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          📤 Тест загрузки файла
        </button>
        
        <button
          onClick={() => runTest('full')}
          disabled={loading}
          className="bg-purple-500 text-white px-6 py-3 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          🚀 Полный тест
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Выполняется тест...</p>
        </div>
      )}

      {testResults && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {testResults.success ? '✅ Результаты теста' : '❌ Ошибка теста'}
          </h3>
          
          <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📝 Инструкции</h3>
        <ul className="space-y-2 text-sm">
          <li><strong>Тест подключения:</strong> Проверяет доступность провайдера хранения</li>
          <li><strong>Тест загрузки:</strong> Создает и загружает тестовый файл</li>
          <li><strong>Полный тест:</strong> Выполняет все проверки</li>
          <li><strong>Переключение провайдера:</strong> Изменяет STORAGE_PROVIDER в .env.local</li>
        </ul>
      </div>
    </div>
  );
}
