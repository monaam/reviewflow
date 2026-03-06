import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Calendar, Users, Loader2 } from 'lucide-react';
import { projectsApi } from '../api/projects';
import { Project, PaginatedResponse } from '../types';
import { LoadingSpinner, SearchInput, FilterButtonGroup, EmptyState } from '../components/common';
import { Modal } from '../components/modals/Modal';
import { useAuthStore } from '../stores/authStore';
import { formatEnumLabel, cardLinkClass } from '../utils/formatters';
import { canCreateProject as canCreateProjectRole } from '../utils/permissions';
import { useListFilter } from '../hooks';
import { formatRelativeTime } from '../utils/date';
import { routes } from '../utils/routes';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const loadProjects = useCallback(async (page = 1) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const params: Record<string, string | number> = { page };
      if (filter !== 'all') params.status = filter;

      const response: PaginatedResponse<Project> = await projectsApi.list(params);

      if (page === 1) {
        setProjects(response.data);
      } else {
        setProjects((prev) => [...prev, ...response.data]);
      }

      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    loadProjects(1);
  }, [loadProjects]);

  const canCreateProject = canCreateProjectRole(user?.role);

  const filteredProjects = useListFilter({
    items: projects,
    searchQuery,
    searchFields: (p) => [p.name, p.client_name, p.description],
  });

  return (
    <div className="px-4 py-6 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            Manage your creative projects
          </p>
        </div>
        {canCreateProject && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary hidden sm:inline-flex"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search projects..."
        />

        <FilterButtonGroup
          options={['all', 'active', 'on_hold', 'completed', 'archived']}
          value={filter}
          onChange={setFilter}
          variant="default"
        />
      </div>

      {/* Projects */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="md" variant="gray" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={searchQuery ? 'No matching projects' : 'No projects found'}
          description={
            searchQuery
              ? 'Try adjusting your search terms.'
              : canCreateProject
              ? 'Create your first project to get started.'
              : 'You have not been added to any projects yet.'
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                to={routes.studio.project(project.id)}
                className={cardLinkClass}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {project.name}
                    </h3>
                    {project.client_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {project.client_name}
                      </p>
                    )}
                  </div>
                  <span className="ml-3 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 capitalize">
                    {formatEnumLabel(project.status)}
                  </span>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5" />
                    {project.assets_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {project.members?.length || 0}
                  </span>
                  {project.deadline && (
                    <span className="flex items-center gap-1 ml-auto">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatRelativeTime(project.deadline)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {currentPage < lastPage && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => loadProjects(currentPage + 1)}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Mobile FAB */}
      {canCreateProject && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed right-4 bottom-20 z-40 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform sm:hidden"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(project) => {
            setShowCreateModal(false);
            navigate(routes.studio.project(project.id));
          }}
        />
      )}

    </div>
  );
}

function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const project = await projectsApi.create({
        name,
        description: description || undefined,
        client_name: clientName || undefined,
        deadline: deadline || undefined,
      });
      onCreated(project);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Create New Project" onClose={onClose}>
      {error && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Project Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="label">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="clientName" className="label">
            Client Name
          </label>
          <input
            id="clientName"
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="deadline" className="label">
            Deadline
          </label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="input"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
