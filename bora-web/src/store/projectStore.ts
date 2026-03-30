// projectStore: Zustand store for current project and save state
// TODO: Track current project ID, title, save status
// TODO: Wire to figureService for CRUD

import { create } from "zustand";

interface Project {
  id: string;
  title: string;
  updatedAt: string;
}

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  isSaving: boolean;
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  setSaving: (saving: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  projects: [],
  isSaving: false,
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  setSaving: (isSaving) => set({ isSaving }),
}));
