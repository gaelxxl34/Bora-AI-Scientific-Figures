const fs = require("fs");
const path = require("path");

function walkSvgs(dir, base) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkSvgs(full, base));
    } else if (entry.name.endsWith(".svg")) {
      const rel = path.relative(base, full);
      const parts = rel.split(path.sep);
      const name = path.basename(entry.name, ".svg").replace(/[-_]/g, " ");
      let category = "General";
      const source = parts[0];
      if (source === "bioicons" && parts.length >= 3) {
        category = parts[2].replace(/_/g, " ");
      } else if (source === "genemania") {
        category = "Model Organisms";
      } else if (source === "scienceicons") {
        category = "Science Workflow";
      } else if (source === "tabler") {
        // Categorize tabler icons by name keywords
        const n = name.toLowerCase();
        if (/arrow|chevron|caret|direction/.test(n)) category = "Arrows";
        else if (/align|layout|columns|grid|stack|layers|separator|distribute|spacing/.test(n)) category = "Layout";
        else if (/bold|italic|underline|strikethrough|subscript|superscript|heading|typography|font|text|letter|line-height|overline|blockquote|quote|abc|indent|list/.test(n)) category = "Typography";
        else if (/circle|square|rectangle|triangle|hexagon|octagon|pentagon|diamond|star|oval|polygon|line|point|dots|cone|cube|cylinder|sphere|pyramid/.test(n)) category = "Shapes";
        else if (/pencil|pen|brush|paint|palette|color|droplet|bucket|pipette|highlight|eraser|wand|sparkles/.test(n)) category = "Drawing";
        else if (/flask|beaker|microscope|atom|dna|virus|bacteria|pill|stethoscope|brain|heart|lungs|bone|ear|vaccine|temperature|thermometer|telescope|biohazard|radioactive|radiation|plant|leaf|flower|tree|bug|fish|paw|feather/.test(n)) category = "Science";
        else if (/chart|graph|trending|math|calculator|percentage|sum|function|sigma|infinity|number|variable|equal|plus|minus|multiply|divide|brackets|parentheses|wave|angle|ruler|compass|protractor|scale|measure|geometry/.test(n)) category = "Math & Charts";
        else if (/file|folder|photo|image|camera|picture|artboard|frame|crop|resize|dimensions|proportions|transform|rotate|flip|panorama|vector/.test(n)) category = "Files & Media";
        else if (/zoom|search|eye|focus|maximize|minimize|fullscreen|scan|aspect/.test(n)) category = "View";
        else if (/cursor|pointer|hand|click|grab|crosshair|target|pin|marquee|select|lasso|magnet/.test(n)) category = "Selection";
        else if (/undo|redo|copy|clipboard|cut|paste|trash|save|download|upload|export|import|refresh|reload|restore|lock|link|unlink|share|send/.test(n)) category = "Actions";
        else category = "UI";
      } else if (source === "reactome") {
        // Category comes from folder name (arrow, cell_element, etc.)
        if (parts.length >= 2) {
          category = parts[1].replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        }
      } else if (source === "scidraw") {
        // Category from subfolder (cell, mouse, human, etc.)
        if (parts.length >= 2) {
          category = parts[1].replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        } else {
          category = "Scientific Drawings";
        }
      } else if (source === "servier") {
        // Category from subfolder
        if (parts.length >= 2) {
          category = parts[1].replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        } else {
          category = "Medical Art";
        }
      }
      results.push({
        id: rel.replace(/[\\/]/g, "__").replace(".svg", ""),
        name,
        category,
        source,
        path: "/icons/" + rel.split(path.sep).join("/"),
      });
    }
  }
  return results;
}

const base = path.join(__dirname, "..", "public", "icons");
const icons = walkSvgs(base, base);
fs.writeFileSync(
  path.join(base, "manifest.json"),
  JSON.stringify(icons)
);
console.log("Generated manifest with " + icons.length + " icons");
const categories = [...new Set(icons.map((i) => i.category))].sort();
console.log("Categories (" + categories.length + "):", categories.join(", "));
