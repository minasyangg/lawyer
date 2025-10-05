"use client"

import React from 'react'
import { Folder, Home } from "lucide-react"
import { FolderTreeNode } from '../types'

interface FolderTreeProps {
  folderTree: FolderTreeNode[]
  currentFolderId: number | null
  onFolderClick: (folderId: number | null, path?: string) => void
}

export function FolderTree({ folderTree, currentFolderId, onFolderClick }: FolderTreeProps) {
  const renderFolderTree = (nodes: FolderTreeNode[], level: number = 0): React.ReactNode => {
    return nodes.map((node) => (
      <div key={`folder-tree-${node.id}-${level}`} style={{ marginLeft: `${level * 16}px` }}>
        <div 
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded ${
            currentFolderId === node.id ? 'bg-blue-50 text-blue-600' : ''
          }`}
          onClick={() => onFolderClick(node.id, node.path)}
        >
          <Folder className="w-4 h-4 mr-2" />
          <span className="text-sm truncate">{node.name}</span>
        </div>
        {node.children && node.children.length > 0 && renderFolderTree(node.children, level + 1)}
      </div>
    ))
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Папки</h3>
      <div className="space-y-1">
        <div 
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded ${
            currentFolderId === null ? 'bg-blue-50 text-blue-600' : ''
          }`}
          onClick={() => onFolderClick(null)}
        >
          <Home className="w-4 h-4 mr-2" />
          <span className="text-sm">Корень</span>
        </div>
        {renderFolderTree(folderTree)}
      </div>
    </div>
  )
}