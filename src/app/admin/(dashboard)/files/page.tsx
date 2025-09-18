import { FileManagerPage } from "../../../../components/admin/FileManagerPage"

export default function AdminFilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Файловый менеджер</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <FileManagerPage />
      </div>
    </div>
  )
}