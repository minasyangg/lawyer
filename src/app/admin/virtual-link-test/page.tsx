"use client"

import { useState } from 'react'

export default function VirtualLinkTest() {
  const [testUrl, setTestUrl] = useState('')
  const [result, setResult] = useState('')

  const testVirtualLink = async () => {
    if (!testUrl) {
      setResult('Введите URL для тестирования')
      return
    }

    try {
      const response = await fetch(testUrl)
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        setResult(`✅ Успешно! Content-Type: ${contentType}`)
      } else {
        setResult(`❌ Ошибка: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      setResult(`❌ Ошибка сети: ${error}`)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Тест виртуальных ссылок</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            URL для тестирования:
          </label>
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="/api/files/abc123def456"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <button
          onClick={testVirtualLink}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Тестировать ссылку
        </button>
        
        {result && (
          <div className="p-4 bg-gray-100 rounded">
            <pre>{result}</pre>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Инструкции:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Загрузите файл через файловый менеджер</li>
          <li>Скопируйте виртуальную ссылку файла</li>
          <li>Вставьте ссылку в поле выше</li>
          <li>Нажмите &quot;Тестировать ссылку&quot;</li>
        </ol>
      </div>
    </div>
  )
}
