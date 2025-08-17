
# Diagrammatic: Simple Flowchart Builder

Diagrammatic is a local-only, privacy-friendly web application for creating flowcharts and diagrams with ease. Built with React and TypeScript, it provides a modern, intuitive interface for quick diagramming—no external diagram libraries or cloud storage required.

## Features

- **Add All Common Flowchart Shapes:** Rectangle, circle, diamond, parallelogram, trapezoid, triangle, hexagon, cylinder, actor, annotation, line, bracket, cloud, star, and text.
- **Drag-and-Drop Canvas:** Move nodes freely, pan the canvas, and zoom for large diagrams.
- **Connectors:** Draw connectors between nodes with automatic boundary snapping.
- **Edge Labels:** Add, edit, and delete labels on connectors. Robust editing with Enter/Escape support.
- **Undo/Redo:** Full undo/redo support for all actions.
- **Resizable Nodes:** Resize nodes from any edge or corner, with correct directionality and minimum size.
- **Toolbar:** Shape palette for quick node creation.
- **Sidebar Style Panel:** Edit node background and border color, and text content.
- **Text Nodes:** Multi-line, auto-resizing, and boundary-wrapped text nodes.
- **Delete Nodes/Edges:** Remove nodes or edges with a button or keyboard shortcut.
- **No External Storage:** All data is local to your browser. No accounts, no cloud.

## Getting Started

1. **Install dependencies:**
	```bash
	npm install
	```
2. **Start the development server:**
	```bash
	npm run dev
	```
3. **Open your browser:**
	Visit `http://localhost:5173` (or the port shown in your terminal).

## Usage

- Select a shape from the toolbar and click on the canvas to add it.
- Drag nodes to move them. Use the handles to resize.
- Click and drag from a node's connector point to another node to create an edge.
- Double-click an edge label to edit it. Press Enter to save, Escape to cancel.
- Use the sidebar to change node styles and text.
- Use Undo/Redo buttons or Ctrl+Z/Ctrl+Y.

## Project Structure

- `src/` — Main source code
  - `components/` — React components (Canvas, FlowchartNode, Toolbar, StylePanel, etc.)
  - `hooks/` — Custom React hooks
  - `lib/` — Utility functions
  - `pages/` — App entry point
  - `types/` — TypeScript types
- `public/` — Static assets
- `index.html` — Main HTML file
- `tailwind.config.ts` — Tailwind CSS config
- `vite.config.ts` — Vite config

## Tech Stack

- React 18+
- TypeScript
- Vite
- Tailwind CSS

## License

MIT License. See [LICENSE](LICENSE) for details.
