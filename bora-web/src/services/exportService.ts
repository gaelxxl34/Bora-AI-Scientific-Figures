// exportService: Export download handler
// TODO: POST to /export with current SVG + format + resolution
// TODO: Trigger browser download from returned URL

import { api } from "./api";

export const exportService = {
  async exportFigure(data: {
    svgContent: string;
    format: "svg" | "png" | "pdf";
    dpi: number;
  }) {
    // TODO: POST /export
    const response = await api.post("/export", data);
    return response.data; // { downloadUrl: string }
  },
};
