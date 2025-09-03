"use client"

import { useState } from 'react'

export default function VirtualLinkTest() {
  const [virtualId, setVirtualId] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  
  const testVirtualLink = () => {
    if (virtualId) {
      const url = `/api/files/${virtualId}`
      setFileUrl(url)
    }
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Тест виртуальных ссылок</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Введите Virtual ID файла:
        </label>
        <input
          type="text"
          value={virtualId}
          onChange={(e) => setVirtualId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
          placeholder="Например: abc123def456"
        />
      </div>
      
      <button
        onClick={testVirtualLink}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Создать ссылку
      </button>
      
      {fileUrl && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Сгенерированная ссылка:</p>
          <a 
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {fileUrl}
          </a>
          
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Предварительный просмотр:</p>
            <img 
              src={fileUrl} 
              alt="Test file"
              className="max-w-sm border border-gray-300 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                if (nextElement) {
                  nextElement.style.display = 'block'
                }
              }}
            />
            <div style={{display: 'none'}} className="text-red-500 text-sm">
              Ошибка загрузки файла. Проверьте Virtual ID.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
