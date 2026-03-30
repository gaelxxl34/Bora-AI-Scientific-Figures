import { Routes, Route } from "react-router-dom";
import { Dashboard } from "../Dashboard/Dashboard";
import { EditorLayout } from "../Editor/EditorLayout";
import { AdminLayout } from "../Admin/AdminLayout";

// AppShell: Routes between dashboard, editor, and admin views

export function AppShell() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="editor/:figureId" element={<EditorLayout />} />
      <Route path="admin/*" element={<AdminLayout />} />
    </Routes>
  );
}
