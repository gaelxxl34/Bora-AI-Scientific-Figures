// ProjectsSidebar: List of saved figures/projects
// TODO: Fetch projects from projectStore
// TODO: Click to load project into canvas

import { NewProjectButton } from "./NewProjectButton";

export function ProjectsSidebar() {
  // TODO: Read from projectStore
  const projects: { id: string; title: string }[] = [];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">Projects</h2>
        <NewProjectButton />
      </div>
      <div className="space-y-1">
        {projects.length === 0 && (
          <p className="text-xs text-slate">No projects yet</p>
        )}
        {/* TODO: Render ProjectCard for each project */}
      </div>
    </div>
  );
}
