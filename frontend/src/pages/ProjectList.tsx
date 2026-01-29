import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, FolderOpen, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import FileUpload from '../components/FileUpload';
import ProgressBar from '../components/ProgressBar';
import { getProjects, uploadProject, deleteProject, Project } from '../services/api';

export default function ProjectList() {
  const [projects, setProjects] = useState<(Project & { totalEntries: number; translatedEntries: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await getProjects();
      setProjects(response.data as any);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const response = await uploadProject(file);
      toast.success('Project uploaded successfully');
      navigate(`/project/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteProject(id);
      toast.success('Project deleted');
      loadProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Projects</h1>
        <p className="text-gray-600">Upload and manage your .po translation files</p>
      </div>

      <div className="mb-8">
        <FileUpload onUpload={handleUpload} isLoading={isUploading} />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No projects yet. Upload a .po file to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <h3 className="text-lg font-medium text-gray-900 hover:text-primary-600">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>{project.filename}</span>
                    {project.language && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {project.language}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Updated {formatDate(project.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-48">
                    <ProgressBar
                      translated={project.translatedEntries}
                      total={project.totalEntries}
                    />
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id, project.name);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
