/**
 * Scientific figure templates built from the Bora icon library.
 *
 * Each template has:
 *  - textElements: Fabric.js textbox objects for labels/titles
 *  - iconElements: references to icons in public/icons/ with position + scale
 *  - shapeElements: simple rects/circles for backgrounds, compartments, arrows
 *
 * At load time, the template loader fetches icon SVGs, places them via
 * fabric.loadSVGFromString, and adds text/shape objects normally.
 */

export interface TemplateTextElement {
  type: "textbox";
  text: string;
  left: number;
  top: number;
  width: number;
  fontSize: number;
  fontFamily: string;
  fontWeight?: string;
  fontStyle?: string;
  fill: string;
  textAlign?: string;
  opacity?: number;
}

export interface TemplateIconElement {
  iconPath: string; // e.g. "/icons/bioicons/..."
  name: string;
  left: number;
  top: number;
  scale: number; // target width in px
}

export interface TemplateShapeElement {
  type: "rect" | "circle";
  left: number;
  top: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
  opacity?: number;
}

export interface Template {
  id: string;
  title: string;
  field: string;
  description: string;
  textElements: TemplateTextElement[];
  iconElements: TemplateIconElement[];
  shapeElements: TemplateShapeElement[];
}

export const templates: Template[] = [
  // ═══════════════════════════════════════════════════════
  // T1 — Cell Signaling Pathway
  // ═══════════════════════════════════════════════════════
  {
    id: "t1",
    title: "Cell Signaling Pathway",
    field: "Cell Biology",
    description: "Receptor-mediated signaling with kinase cascade and nuclear response",
    shapeElements: [
      // Extracellular region
      { type: "rect", left: 30, top: 75, width: 900, height: 130, fill: "#eef6ff", rx: 14, ry: 14, stroke: "#93c5fd", strokeWidth: 1, opacity: 0.6 },
      // Cell membrane band
      { type: "rect", left: 30, top: 215, width: 900, height: 16, fill: "#fbbf24", rx: 8, ry: 8, opacity: 0.7 },
      // Cytoplasm region
      { type: "rect", left: 30, top: 245, width: 900, height: 250, fill: "#f0fdf4", rx: 14, ry: 14, stroke: "#86efac", strokeWidth: 1, opacity: 0.4 },
      // Nucleus
      { type: "rect", left: 250, top: 510, width: 460, height: 120, fill: "#faf5ff", rx: 60, ry: 60, stroke: "#c084fc", strokeWidth: 2, opacity: 0.5 },
    ],
    textElements: [
      { type: "textbox", text: "Cell Signaling Pathway", left: 280, top: 22, width: 400, fontSize: 26, fontFamily: "Inter", fontWeight: "bold", fill: "#0f1117", textAlign: "center" },
      { type: "textbox", text: "Extracellular Space", left: 50, top: 82, width: 160, fontSize: 10, fontFamily: "Inter", fontWeight: "600", fill: "#3b82f6" },
      { type: "textbox", text: "Cell Membrane", left: 50, top: 233, width: 120, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#92400e" },
      { type: "textbox", text: "Cytoplasm", left: 50, top: 252, width: 90, fontSize: 10, fontFamily: "Inter", fontWeight: "600", fill: "#16a34a" },
      { type: "textbox", text: "Nucleus", left: 440, top: 518, width: 80, fontSize: 12, fontFamily: "Inter", fontWeight: "600", fill: "#7c3aed", textAlign: "center" },
      // Labels under icons
      { type: "textbox", text: "Ligand", left: 115, top: 185, width: 60, fontSize: 9, fontFamily: "Inter", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "Receptor", left: 290, top: 185, width: 70, fontSize: 9, fontFamily: "Inter", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "Kinase", left: 175, top: 430, width: 60, fontSize: 9, fontFamily: "Inter", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "Kinase", left: 385, top: 430, width: 60, fontSize: 9, fontFamily: "Inter", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "Kinase", left: 595, top: 430, width: 60, fontSize: 9, fontFamily: "Inter", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "Transcription", left: 430, top: 570, width: 100, fontSize: 9, fontFamily: "Inter", fill: "#6b21a8", textAlign: "center" },
      // Arrows
      { type: "textbox", text: "→", left: 230, top: 122, width: 40, fontSize: 28, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "↓", left: 325, top: 235, width: 40, fontSize: 28, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "→", left: 290, top: 370, width: 40, fontSize: 28, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "→", left: 500, top: 370, width: 40, fontSize: 28, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "↓", left: 640, top: 440, width: 40, fontSize: 28, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "Created with Bora AI", left: 380, top: 645, width: 200, fontSize: 9, fontFamily: "Inter", fill: "#d1d5db", textAlign: "center" },
    ],
    iconElements: [
      { iconPath: "/icons/bioicons/cc-by-3.0/Blood_Immunology/Servier/antibody-ligand-1.svg", name: "Ligand", left: 110, top: 110, scale: 65 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Receptors_channels/Servier/7helix-receptor-membrane.svg", name: "Receptor", left: 280, top: 100, scale: 80 },
      { iconPath: "/icons/reactome/protein/kinase.svg", name: "Kinase 1", left: 165, top: 340, scale: 70 },
      { iconPath: "/icons/reactome/protein/kinase.svg", name: "Kinase 2", left: 375, top: 340, scale: 70 },
      { iconPath: "/icons/reactome/protein/kinase.svg", name: "Kinase 3", left: 585, top: 340, scale: 70 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Intracellular_components/Servier/nucleus.svg", name: "Nucleus", left: 400, top: 530, scale: 55 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // T2 — CRISPR-Cas9 Mechanism
  // ═══════════════════════════════════════════════════════
  {
    id: "t2",
    title: "CRISPR-Cas9 Mechanism",
    field: "Genetics",
    description: "Guide RNA design, Cas9 binding, and DNA double-strand break repair",
    shapeElements: [
      // Step boxes
      { type: "rect", left: 50, top: 90, width: 250, height: 190, fill: "#eef6ff", rx: 14, ry: 14, stroke: "#93c5fd", strokeWidth: 1.5 },
      { type: "rect", left: 350, top: 90, width: 250, height: 190, fill: "#f0fdf4", rx: 14, ry: 14, stroke: "#86efac", strokeWidth: 1.5 },
      { type: "rect", left: 650, top: 90, width: 250, height: 190, fill: "#fef2f2", rx: 14, ry: 14, stroke: "#fca5a5", strokeWidth: 1.5 },
      // DNA strand bar
      { type: "rect", left: 50, top: 340, width: 850, height: 14, fill: "#3b82f6", rx: 7, ry: 7 },
      { type: "rect", left: 50, top: 364, width: 850, height: 14, fill: "#60a5fa", rx: 7, ry: 7 },
      // Repair outcome boxes
      { type: "rect", left: 80, top: 460, width: 360, height: 160, fill: "#fef3c7", rx: 14, ry: 14, stroke: "#fbbf24", strokeWidth: 1.5 },
      { type: "rect", left: 520, top: 460, width: 360, height: 160, fill: "#ede9fe", rx: 14, ry: 14, stroke: "#c4b5fd", strokeWidth: 1.5 },
    ],
    textElements: [
      { type: "textbox", text: "CRISPR-Cas9 Gene Editing", left: 260, top: 22, width: 440, fontSize: 26, fontFamily: "Inter", fontWeight: "bold", fill: "#0f1117", textAlign: "center" },
      // Step labels
      { type: "textbox", text: "1. Guide RNA Design", left: 80, top: 98, width: 190, fontSize: 14, fontFamily: "Inter", fontWeight: "600", fill: "#1d4ed8" },
      { type: "textbox", text: "2. Cas9 Binding", left: 390, top: 98, width: 180, fontSize: 14, fontFamily: "Inter", fontWeight: "600", fill: "#166534" },
      { type: "textbox", text: "3. DNA Cleavage", left: 690, top: 98, width: 180, fontSize: 14, fontFamily: "Inter", fontWeight: "600", fill: "#991b1b" },
      // DNA labels
      { type: "textbox", text: "5' ————————— Target DNA ————————— 3'", left: 150, top: 340, width: 660, fontSize: 10, fontFamily: "JetBrains Mono", fill: "#ffffff", textAlign: "center" },
      { type: "textbox", text: "3' ————————— Complementary ————————— 5'", left: 150, top: 364, width: 660, fontSize: 10, fontFamily: "JetBrains Mono", fill: "#ffffff", textAlign: "center" },
      // PAM
      { type: "textbox", text: "PAM", left: 680, top: 322, width: 40, fontSize: 10, fontFamily: "JetBrains Mono", fontWeight: "bold", fill: "#dc2626", textAlign: "center" },
      // Arrows between steps
      { type: "textbox", text: "→", left: 305, top: 170, width: 40, fontSize: 28, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "→", left: 605, top: 170, width: 40, fontSize: 28, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      // Repair
      { type: "textbox", text: "Repair Outcomes", left: 365, top: 420, width: 230, fontSize: 18, fontFamily: "Inter", fontWeight: "bold", fill: "#0f1117", textAlign: "center" },
      { type: "textbox", text: "NHEJ (Error-prone)", left: 150, top: 470, width: 220, fontSize: 14, fontFamily: "Inter", fontWeight: "bold", fill: "#b45309", textAlign: "center" },
      { type: "textbox", text: "→ Gene knockout\n→ Insertions / Deletions", left: 140, top: 545, width: 240, fontSize: 11, fontFamily: "Inter", fill: "#92400e", textAlign: "center" },
      { type: "textbox", text: "HDR (Precise)", left: 600, top: 470, width: 200, fontSize: 14, fontFamily: "Inter", fontWeight: "bold", fill: "#6d28d9", textAlign: "center" },
      { type: "textbox", text: "→ Gene insertion\n→ Point mutations", left: 600, top: 545, width: 200, fontSize: 11, fontFamily: "Inter", fill: "#5b21b6", textAlign: "center" },
      { type: "textbox", text: "Created with Bora AI", left: 380, top: 645, width: 200, fontSize: 9, fontFamily: "Inter", fill: "#d1d5db", textAlign: "center" },
    ],
    iconElements: [
      { iconPath: "/icons/bioicons/cc-0/Nucleic_acids/James-Lloyd/DNA_double_helix.svg", name: "DNA helix", left: 100, top: 140, scale: 80 },
      { iconPath: "/icons/bioicons/cc-by-4.0/Nucleic_acids/DBCLS/CRISPR-CAS9-pink.svg", name: "Cas9", left: 400, top: 130, scale: 90 },
      { iconPath: "/icons/bioicons/cc-0/Nucleic_acids/umasstr/CRISPR_Cas9_vector.svg", name: "CRISPR vector", left: 700, top: 130, scale: 90 },
      { iconPath: "/icons/bioicons/cc-0/Nucleic_acids/James-Lloyd/DNA_double_helix.svg", name: "NHEJ DNA", left: 190, top: 490, scale: 55 },
      { iconPath: "/icons/bioicons/cc-0/Nucleic_acids/EmilyADaniel/plasmid-3.svg", name: "HDR template", left: 640, top: 490, scale: 55 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // T3 — Immune Response Diagram
  // ═══════════════════════════════════════════════════════
  {
    id: "t3",
    title: "Immune Response Diagram",
    field: "Immunology",
    description: "Innate vs adaptive immunity with cell types from the icon library",
    shapeElements: [
      // Innate panel
      { type: "rect", left: 30, top: 80, width: 430, height: 530, fill: "#fff7ed", rx: 16, ry: 16, stroke: "#fdba74", strokeWidth: 2 },
      // Adaptive panel
      { type: "rect", left: 500, top: 80, width: 430, height: 530, fill: "#eff6ff", rx: 16, ry: 16, stroke: "#93c5fd", strokeWidth: 2 },
    ],
    textElements: [
      { type: "textbox", text: "Immune Response Overview", left: 275, top: 22, width: 410, fontSize: 26, fontFamily: "Inter", fontWeight: "bold", fill: "#0f1117", textAlign: "center" },
      // Innate
      { type: "textbox", text: "Innate Immunity", left: 140, top: 92, width: 220, fontSize: 18, fontFamily: "Inter", fontWeight: "bold", fill: "#c2410c", textAlign: "center" },
      { type: "textbox", text: "Non-specific, rapid response (minutes–hours)", left: 90, top: 118, width: 310, fontSize: 10, fontFamily: "Inter", fill: "#9a3412", textAlign: "center" },
      // Innate cell labels
      { type: "textbox", text: "Macrophage", left: 70, top: 270, width: 90, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#0f1117", textAlign: "center" },
      { type: "textbox", text: "Neutrophil", left: 220, top: 270, width: 90, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#0f1117", textAlign: "center" },
      { type: "textbox", text: "NK Cell", left: 70, top: 420, width: 90, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#0f1117", textAlign: "center" },
      { type: "textbox", text: "Dendritic Cell", left: 220, top: 420, width: 100, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#0f1117", textAlign: "center" },
      { type: "textbox", text: "Physical & Chemical Barriers:\nSkin, Mucosa, Complement, Interferons", left: 70, top: 510, width: 350, fontSize: 10, fontFamily: "Inter", fill: "#9a3412", textAlign: "center" },
      // Adaptive
      { type: "textbox", text: "Adaptive Immunity", left: 600, top: 92, width: 240, fontSize: 18, fontFamily: "Inter", fontWeight: "bold", fill: "#1d4ed8", textAlign: "center" },
      { type: "textbox", text: "Specific, memory-forming (days–weeks)", left: 570, top: 118, width: 300, fontSize: 10, fontFamily: "Inter", fill: "#1e40af", textAlign: "center" },
      // Adaptive cell labels
      { type: "textbox", text: "B Cell", left: 545, top: 270, width: 80, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#0f1117", textAlign: "center" },
      { type: "textbox", text: "T Lymphocyte", left: 700, top: 270, width: 100, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#0f1117", textAlign: "center" },
      { type: "textbox", text: "Antibody", left: 545, top: 420, width: 80, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#0f1117", textAlign: "center" },
      { type: "textbox", text: "Memory Cell", left: 700, top: 420, width: 100, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#0f1117", textAlign: "center" },
      { type: "textbox", text: "Humoral: Antibodies, Complement activation\nCell-mediated: Cytotoxic killing, Cytokines", left: 530, top: 510, width: 370, fontSize: 10, fontFamily: "Inter", fill: "#1e40af", textAlign: "center" },
      // Bridge arrow
      { type: "textbox", text: "⟶", left: 455, top: 320, width: 50, fontSize: 28, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "Antigen\npresentation", left: 447, top: 355, width: 70, fontSize: 8, fontFamily: "Inter", fill: "#6b7280", textAlign: "center" },
      { type: "textbox", text: "Created with Bora AI", left: 380, top: 645, width: 200, fontSize: 9, fontFamily: "Inter", fill: "#d1d5db", textAlign: "center" },
    ],
    iconElements: [
      { iconPath: "/icons/bioicons/cc-by-3.0/Blood_Immunology/Servier/macrophage.svg", name: "Macrophage", left: 70, top: 155, scale: 90 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Blood_Immunology/Servier/neutrophil-granulocyte-1.svg", name: "Neutrophil", left: 220, top: 155, scale: 90 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Blood_Immunology/Servier/nk-cell.svg", name: "NK Cell", left: 70, top: 305, scale: 90 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Blood_Immunology/Servier/dendritic-cell-1.svg", name: "Dendritic Cell", left: 220, top: 305, scale: 90 },
      { iconPath: "/icons/bioicons/cc-by-4.0/Blood_Immunology/El-Jayawant/B-cell_1.svg", name: "B Cell", left: 545, top: 155, scale: 90 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Blood_Immunology/Servier/t-lymphocyte.svg", name: "T Lymphocyte", left: 700, top: 155, scale: 90 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Blood_Immunology/Servier/antibody-1.svg", name: "Antibody", left: 545, top: 305, scale: 90 },
      { iconPath: "/icons/reactome/cell_type/memory-cell.svg", name: "Memory Cell", left: 700, top: 305, scale: 90 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // T4 — Neuron Structure
  // ═══════════════════════════════════════════════════════
  {
    id: "t4",
    title: "Neuron Structure",
    field: "Neuroscience",
    description: "Labeled neuron anatomy with soma, axon, dendrites, and synapse detail",
    shapeElements: [
      // Synapse detail box
      { type: "rect", left: 180, top: 430, width: 600, height: 200, fill: "#fefce8", rx: 14, ry: 14, stroke: "#fde68a", strokeWidth: 1.5 },
    ],
    textElements: [
      { type: "textbox", text: "Neuron Anatomy", left: 340, top: 22, width: 280, fontSize: 26, fontFamily: "Inter", fontWeight: "bold", fill: "#0f1117", textAlign: "center" },
      // Main neuron labels
      { type: "textbox", text: "Pyramidal Neuron", left: 80, top: 115, width: 140, fontSize: 11, fontFamily: "Inter", fontWeight: "600", fill: "#7c3aed", textAlign: "center" },
      { type: "textbox", text: "Astrocyte", left: 380, top: 115, width: 90, fontSize: 11, fontFamily: "Inter", fontWeight: "600", fill: "#0891b2", textAlign: "center" },
      { type: "textbox", text: "Oligodendrocyte", left: 600, top: 115, width: 120, fontSize: 11, fontFamily: "Inter", fontWeight: "600", fill: "#059669", textAlign: "center" },
      { type: "textbox", text: "Microglia", left: 790, top: 115, width: 90, fontSize: 11, fontFamily: "Inter", fontWeight: "600", fill: "#dc2626", textAlign: "center" },
      // Synapse section
      { type: "textbox", text: "Synapse Detail", left: 410, top: 440, width: 140, fontSize: 14, fontFamily: "Inter", fontWeight: "bold", fill: "#a16207", textAlign: "center" },
      { type: "textbox", text: "Presynaptic\nTerminal", left: 220, top: 475, width: 100, fontSize: 10, fontFamily: "Inter", fontWeight: "600", fill: "#92400e", textAlign: "center" },
      { type: "textbox", text: "Synapse", left: 430, top: 475, width: 100, fontSize: 10, fontFamily: "Inter", fontWeight: "600", fill: "#92400e", textAlign: "center" },
      { type: "textbox", text: "Myelinated\nNerve", left: 630, top: 475, width: 100, fontSize: 10, fontFamily: "Inter", fontWeight: "600", fill: "#92400e", textAlign: "center" },
      // Arrow between synapse elements
      { type: "textbox", text: "→", left: 365, top: 540, width: 40, fontSize: 24, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "→", left: 575, top: 540, width: 40, fontSize: 24, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "Created with Bora AI", left: 380, top: 645, width: 200, fontSize: 9, fontFamily: "Inter", fill: "#d1d5db", textAlign: "center" },
    ],
    iconElements: [
      { iconPath: "/icons/scidraw/cell/ca1-pyramidal-neuron.svg", name: "Pyramidal Neuron", left: 60, top: 140, scale: 160 },
      { iconPath: "/icons/reactome/cell_type/astrocyte.svg", name: "Astrocyte", left: 360, top: 140, scale: 130 },
      { iconPath: "/icons/bioicons/cc-by-4.0/Cell_culture/DBCLS/oligodendrocyte.svg", name: "Oligodendrocyte", left: 580, top: 140, scale: 130 },
      { iconPath: "/icons/scidraw/cell/microgliarest.svg", name: "Microglia", left: 780, top: 155, scale: 100 },
      // Synapse detail row
      { iconPath: "/icons/scidraw/cell/synapse.svg", name: "Synapse", left: 230, top: 505, scale: 95 },
      { iconPath: "/icons/reactome/background/synapse.svg", name: "Synapse detail", left: 430, top: 505, scale: 95 },
      { iconPath: "/icons/reactome/cell_element/myelinated-periferal-nerve.svg", name: "Myelin sheath", left: 630, top: 505, scale: 95 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // T5 — Western Blot Protocol
  // ═══════════════════════════════════════════════════════
  {
    id: "t5",
    title: "Western Blot Protocol",
    field: "Molecular Biology",
    description: "Step-by-step western blot workflow with lab equipment icons",
    shapeElements: [
      // Step boxes — row 1
      { type: "rect", left: 40, top: 85, width: 180, height: 190, fill: "#eef6ff", rx: 12, ry: 12, stroke: "#93c5fd", strokeWidth: 1.5 },
      { type: "rect", left: 250, top: 85, width: 180, height: 190, fill: "#f0fdf4", rx: 12, ry: 12, stroke: "#86efac", strokeWidth: 1.5 },
      { type: "rect", left: 460, top: 85, width: 180, height: 190, fill: "#fef3c7", rx: 12, ry: 12, stroke: "#fde68a", strokeWidth: 1.5 },
      { type: "rect", left: 670, top: 85, width: 180, height: 190, fill: "#faf5ff", rx: 12, ry: 12, stroke: "#d8b4fe", strokeWidth: 1.5 },
      // Step boxes — row 2
      { type: "rect", left: 130, top: 340, width: 200, height: 190, fill: "#fef2f2", rx: 12, ry: 12, stroke: "#fca5a5", strokeWidth: 1.5 },
      { type: "rect", left: 380, top: 340, width: 200, height: 190, fill: "#fff1f2", rx: 12, ry: 12, stroke: "#fda4af", strokeWidth: 1.5 },
      { type: "rect", left: 630, top: 340, width: 200, height: 190, fill: "#ecfdf5", rx: 12, ry: 12, stroke: "#6ee7b7", strokeWidth: 1.5 },
    ],
    textElements: [
      { type: "textbox", text: "Western Blot Protocol", left: 310, top: 22, width: 340, fontSize: 26, fontFamily: "Inter", fontWeight: "bold", fill: "#0f1117", textAlign: "center" },
      // Row 1 step headers
      { type: "textbox", text: "1. Sample Prep", left: 60, top: 92, width: 140, fontSize: 12, fontFamily: "Inter", fontWeight: "bold", fill: "#1d4ed8", textAlign: "center" },
      { type: "textbox", text: "Lyse, extract,\nquantify protein", left: 60, top: 230, width: 140, fontSize: 9, fontFamily: "Inter", fill: "#3b82f6", textAlign: "center" },
      { type: "textbox", text: "2. SDS-PAGE", left: 270, top: 92, width: 140, fontSize: 12, fontFamily: "Inter", fontWeight: "bold", fill: "#166534", textAlign: "center" },
      { type: "textbox", text: "Separate by\nmolecular weight", left: 270, top: 230, width: 140, fontSize: 9, fontFamily: "Inter", fill: "#16a34a", textAlign: "center" },
      { type: "textbox", text: "3. Transfer", left: 480, top: 92, width: 140, fontSize: 12, fontFamily: "Inter", fontWeight: "bold", fill: "#a16207", textAlign: "center" },
      { type: "textbox", text: "To PVDF / NC\nmembrane", left: 480, top: 230, width: 140, fontSize: 9, fontFamily: "Inter", fill: "#d97706", textAlign: "center" },
      { type: "textbox", text: "4. Blocking", left: 690, top: 92, width: 140, fontSize: 12, fontFamily: "Inter", fontWeight: "bold", fill: "#6b21a8", textAlign: "center" },
      { type: "textbox", text: "BSA or milk\n(1 hr, RT)", left: 690, top: 230, width: 140, fontSize: 9, fontFamily: "Inter", fill: "#7c3aed", textAlign: "center" },
      // Row 2 step headers
      { type: "textbox", text: "5. Primary Ab", left: 155, top: 348, width: 150, fontSize: 12, fontFamily: "Inter", fontWeight: "bold", fill: "#991b1b", textAlign: "center" },
      { type: "textbox", text: "Target-specific\n(4°C, overnight)", left: 155, top: 485, width: 150, fontSize: 9, fontFamily: "Inter", fill: "#dc2626", textAlign: "center" },
      { type: "textbox", text: "6. Secondary Ab", left: 400, top: 348, width: 160, fontSize: 12, fontFamily: "Inter", fontWeight: "bold", fill: "#9f1239", textAlign: "center" },
      { type: "textbox", text: "HRP-conjugated\n(RT, 1 hr)", left: 405, top: 485, width: 150, fontSize: 9, fontFamily: "Inter", fill: "#e11d48", textAlign: "center" },
      { type: "textbox", text: "7. Detection", left: 660, top: 348, width: 140, fontSize: 12, fontFamily: "Inter", fontWeight: "bold", fill: "#065f46", textAlign: "center" },
      { type: "textbox", text: "ECL substrate →\nChemiluminescence", left: 655, top: 485, width: 150, fontSize: 9, fontFamily: "Inter", fill: "#059669", textAlign: "center" },
      // Arrows
      { type: "textbox", text: "→", left: 224, top: 160, width: 30, fontSize: 24, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "→", left: 434, top: 160, width: 30, fontSize: 24, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "→", left: 644, top: 160, width: 30, fontSize: 24, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "→", left: 338, top: 415, width: 30, fontSize: 24, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "→", left: 588, top: 415, width: 30, fontSize: 24, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "Created with Bora AI", left: 380, top: 645, width: 200, fontSize: 9, fontFamily: "Inter", fill: "#d1d5db", textAlign: "center" },
    ],
    iconElements: [
      { iconPath: "/icons/bioicons/cc-by-3.0/Chemistry/Servier/micropipette.svg", name: "Pipette", left: 85, top: 120, scale: 80 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Lab_apparatus/Servier/gel-electrophoresis.svg", name: "Gel electrophoresis", left: 285, top: 120, scale: 85 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Lab_apparatus/Servier/electrophoresis-chamber.svg", name: "Transfer", left: 498, top: 120, scale: 85 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Chemistry/Servier/beaker-empty.svg", name: "Beaker", left: 718, top: 120, scale: 80 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Blood_Immunology/Servier/antibody-1.svg", name: "Primary Antibody", left: 185, top: 380, scale: 75 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Blood_Immunology/Servier/antibody-ligand-1.svg", name: "Secondary Antibody", left: 435, top: 380, scale: 75 },
      { iconPath: "/icons/bioicons/cc-by-4.0/General_items/Pooja/western_blotting.svg", name: "Western blot result", left: 672, top: 375, scale: 80 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // T6 — Drug Delivery System
  // ═══════════════════════════════════════════════════════
  {
    id: "t6",
    title: "Drug Delivery System",
    field: "Pharmacology",
    description: "Nanoparticle-based targeted drug delivery with cell uptake",
    shapeElements: [
      // Main NP display area
      { type: "rect", left: 50, top: 80, width: 400, height: 300, fill: "#eef6ff", rx: 16, ry: 16, stroke: "#93c5fd", strokeWidth: 1.5 },
      // Target cell area
      { type: "rect", left: 510, top: 80, width: 400, height: 300, fill: "#f0fdf4", rx: 16, ry: 16, stroke: "#86efac", strokeWidth: 1.5 },
      // Delivery steps row
      { type: "rect", left: 50, top: 450, width: 860, height: 170, fill: "#faf5ff", rx: 14, ry: 14, stroke: "#d8b4fe", strokeWidth: 1 },
    ],
    textElements: [
      { type: "textbox", text: "Targeted Drug Delivery System", left: 230, top: 22, width: 500, fontSize: 26, fontFamily: "Inter", fontWeight: "bold", fill: "#0f1117", textAlign: "center" },
      // NP area
      { type: "textbox", text: "Nanoparticle Carrier", left: 140, top: 90, width: 220, fontSize: 14, fontFamily: "Inter", fontWeight: "bold", fill: "#1d4ed8", textAlign: "center" },
      { type: "textbox", text: "Nanoparticle", left: 100, top: 270, width: 100, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "Drug capsule", left: 280, top: 270, width: 100, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "Receptor\ntarget", left: 190, top: 340, width: 100, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#374151", textAlign: "center" },
      // Target cell area
      { type: "textbox", text: "Target Cell", left: 640, top: 90, width: 140, fontSize: 14, fontFamily: "Inter", fontWeight: "bold", fill: "#166534", textAlign: "center" },
      { type: "textbox", text: "Cell", left: 570, top: 310, width: 80, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "Receptor", left: 720, top: 310, width: 80, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "⟶", left: 450, top: 200, width: 50, fontSize: 32, fontFamily: "Inter", fill: "#9ca3af", textAlign: "center" },
      { type: "textbox", text: "Binding &\nEndocytosis", left: 440, top: 240, width: 80, fontSize: 8, fontFamily: "Inter", fill: "#6b7280", textAlign: "center" },
      // Delivery steps
      { type: "textbox", text: "Delivery Mechanism", left: 360, top: 458, width: 240, fontSize: 14, fontFamily: "Inter", fontWeight: "bold", fill: "#6b21a8", textAlign: "center" },
      { type: "textbox", text: "1. Injection", left: 70, top: 535, width: 80, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "2. Circulation", left: 220, top: 535, width: 90, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "3. Targeting", left: 400, top: 535, width: 80, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "4. Uptake", left: 570, top: 535, width: 80, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#374151", textAlign: "center" },
      { type: "textbox", text: "5. Release", left: 740, top: 535, width: 80, fontSize: 9, fontFamily: "Inter", fontWeight: "600", fill: "#374151", textAlign: "center" },
      // Arrows
      { type: "textbox", text: "→", left: 155, top: 495, width: 30, fontSize: 20, fontFamily: "Inter", fill: "#c4b5fd", textAlign: "center" },
      { type: "textbox", text: "→", left: 325, top: 495, width: 30, fontSize: 20, fontFamily: "Inter", fill: "#c4b5fd", textAlign: "center" },
      { type: "textbox", text: "→", left: 495, top: 495, width: 30, fontSize: 20, fontFamily: "Inter", fill: "#c4b5fd", textAlign: "center" },
      { type: "textbox", text: "→", left: 665, top: 495, width: 30, fontSize: 20, fontFamily: "Inter", fill: "#c4b5fd", textAlign: "center" },
      { type: "textbox", text: "Created with Bora AI", left: 380, top: 645, width: 200, fontSize: 9, fontFamily: "Inter", fill: "#d1d5db", textAlign: "center" },
    ],
    iconElements: [
      { iconPath: "/icons/bioicons/cc-by-4.0/Nanotechnology/Rahel-Khdhr/Nanoparticle.svg", name: "Nanoparticle", left: 90, top: 140, scale: 100 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Human_physiology/Servier/drug-capsule-1.svg", name: "Drug capsule", left: 280, top: 160, scale: 80 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Receptors_channels/Servier/7helix-receptor-membrane.svg", name: "Receptor", left: 190, top: 290, scale: 60 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Intracellular_components/Servier/cell-complete.svg", name: "Target Cell", left: 550, top: 140, scale: 130 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Receptors_channels/Servier/channel-membrane-blue.svg", name: "Cell Receptor", left: 720, top: 180, scale: 90 },
      // Delivery steps icons
      { iconPath: "/icons/bioicons/cc-by-3.0/Human_physiology/Servier/syringe.svg", name: "Syringe", left: 70, top: 485, scale: 50 },
      { iconPath: "/icons/bioicons/cc-by-4.0/Nanotechnology/Rahel-Khdhr/Nanoparticle.svg", name: "Circulation NP", left: 230, top: 485, scale: 45 },
      { iconPath: "/icons/bioicons/cc-by-3.0/Blood_Immunology/Servier/antibody-ligand-1.svg", name: "Targeting", left: 405, top: 485, scale: 45 },
      { iconPath: "/icons/reactome/cell_type/cell-generic.svg", name: "Cell uptake", left: 575, top: 485, scale: 45 },
      { iconPath: "/icons/bioicons/cc-0/Human_physiology/Marcel_Tisch/drugs.svg", name: "Drug release", left: 745, top: 485, scale: 45 },
    ],
  },
];
