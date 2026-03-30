// figureService: Figure CRUD endpoints
// TODO: Implement create, get, update, delete figure calls

import { api } from "./api";

export const figureService = {
  async getFigures() {
    // TODO: GET /figures
    const response = await api.get("/figures");
    return response.data;
  },

  async getFigure(id: string) {
    // TODO: GET /figures/:id
    const response = await api.get(`/figures/${id}`);
    return response.data;
  },

  async createFigure(data: { title: string; projectId: string }) {
    // TODO: POST /figures
    const response = await api.post("/figures", data);
    return response.data;
  },

  async updateFigure(id: string, data: { svgContent?: string; title?: string }) {
    // TODO: PATCH /figures/:id
    const response = await api.patch(`/figures/${id}`, data);
    return response.data;
  },

  async deleteFigure(id: string) {
    // TODO: DELETE /figures/:id
    await api.delete(`/figures/${id}`);
  },
};
