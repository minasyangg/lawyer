import { FileText, FolderOpen, PlusCircle, Eye } from "lucide-react"
import Link from "next/link"

export default function EditorDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <PlusCircle className="h-8 w-8 text-green-600" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Create Article</h3>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Write and publish new articles
          </p>
          <Link
            href="/editor/articles/create"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            New Article
          </Link>
        </div>

        {/* Manage Articles */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">My Articles</h3>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Manage your published articles
          </p>
          <Link
            href="/editor/articles"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            View Articles
          </Link>
        </div>

        {/* File Manager */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FolderOpen className="h-8 w-8 text-purple-600" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">File Manager</h3>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Upload and manage media files
          </p>
          <Link
            href="/editor/files"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            Manage Files
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-8">
            <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Your recent activity will appear here</p>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Editor Dashboard!</h3>
        <p className="text-gray-600">
          As an editor, you have access to create and manage articles, upload files, and collaborate with the team. 
          You can edit your own articles and view others&apos; work. Start by creating your first article or managing your files.
        </p>
      </div>
    </div>
  )
}