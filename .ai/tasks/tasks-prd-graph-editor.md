# Task List: Web-Based Graph Editor

## Relevant Files

- `graph_editor/package.json` - Project dependencies and scripts configuration
- `graph_editor/vite.config.ts` - Vite build configuration
- `graph_editor/tsconfig.json` - TypeScript configuration
- `graph_editor/tailwind.config.js` - Tailwind CSS configuration
- `graph_editor/index.html` - Main HTML entry point
- `graph_editor/src/main.tsx` - React application entry point
- `graph_editor/src/App.tsx` - Main application component
- `graph_editor/src/App.test.tsx` - Unit tests for App component
- `graph_editor/src/types/graph.ts` - TypeScript type definitions for graph data structures
- `graph_editor/src/types/graph.test.ts` - Unit tests for graph types
- `graph_editor/src/models/Graph.ts` - Core graph data model and business logic
- `graph_editor/src/models/Graph.test.ts` - Unit tests for Graph model
- `graph_editor/src/hooks/useGraph.ts` - React hook for graph state management
- `graph_editor/src/hooks/useGraph.test.ts` - Unit tests for useGraph hook
- `graph_editor/src/hooks/useUndoRedo.ts` - React hook for undo/redo functionality
- `graph_editor/src/hooks/useUndoRedo.test.ts` - Unit tests for useUndoRedo hook
- `graph_editor/src/components/GraphViewer.tsx` - Main graph visualization component using D3
- `graph_editor/src/components/GraphViewer.test.tsx` - Unit tests for GraphViewer component
- `graph_editor/src/components/TextPanel.tsx` - Left panel for text representation of graph
- `graph_editor/src/components/TextPanel.test.tsx` - Unit tests for TextPanel component
- `graph_editor/src/components/TextAreaWithLineNumbers.tsx` - Reusable textarea component with line numbers
- `graph_editor/src/components/TextAreaWithLineNumbers.test.tsx` - Unit tests for TextAreaWithLineNumbers component
- `graph_editor/src/components/ModeControls.tsx` - Mode toggle buttons (Edit/Delete/View-Force)
- `graph_editor/src/components/ModeControls.test.tsx` - Unit tests for ModeControls component
- `graph_editor/src/components/GraphControls.tsx` - Graph type and node indexing controls
- `graph_editor/src/components/GraphControls.test.tsx` - Unit tests for GraphControls component
- `graph_editor/src/components/UndoRedoControls.tsx` - Undo/Redo button controls
- `graph_editor/src/components/UndoRedoControls.test.tsx` - Unit tests for UndoRedoControls component
- `graph_editor/src/components/Node.tsx` - Individual node component for D3 rendering
- `graph_editor/src/components/Edge.tsx` - Individual edge component for D3 rendering
- `graph_editor/src/utils/graphParser.ts` - Utilities for parsing text format to graph data
- `graph_editor/src/utils/graphParser.test.ts` - Unit tests for graph parser utilities
- `graph_editor/src/utils/graphSerializer.ts` - Utilities for serializing graph data to text format
- `graph_editor/src/utils/graphSerializer.test.ts` - Unit tests for graph serializer utilities
- `graph_editor/src/context/GraphContext.tsx` - React context for global graph state
- `graph_editor/src/context/GraphContext.test.tsx` - Unit tests for GraphContext
- `graph_editor/src/styles/globals.css` - Global styles and Tailwind imports

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Project Setup and Configuration
  - [x] 1.1 Initialize Vite React TypeScript project with required dependencies
  - [x] 1.2 Install and configure D3.js, D3-force, and related packages
  - [x] 1.3 Set up Tailwind CSS with custom configuration for graph editor styling
  - [x] 1.4 Configure TypeScript with strict settings and path aliases
  - [x] 1.5 Set up Jest testing framework with React Testing Library
  - [x] 1.6 Create basic project structure with src/ directories for components, hooks, models, utils
  - [x] 1.7 Configure ESLint and Prettier for code quality and formatting
  - [x] 1.8 Set up package.json scripts for development, build, and testing

- [x] 2.0 Core Graph Data Model Implementation
  - [x] 2.1 Define TypeScript interfaces for Node, Edge, and Graph data structures
  - [x] 2.2 Implement Graph class as single source of truth for graph data
  - [x] 2.3 Add methods for node management (add, remove, update, get by id)
  - [x] 2.4 Add methods for edge management (add, remove, update, get by source/target)
  - [x] 2.5 Implement graph validation and constraint checking
  - [x] 2.6 Add support for both directed and undirected graph modes
  - [x] 2.7 Implement node labeling system (0-indexed, 1-indexed, custom strings)
  - [x] 2.8 Add edge weight support as string values
  - [x] 2.9 Create graph serialization methods for text format conversion
  - [x] 2.10 Implement graph parsing methods from text format

- [ ] 3.0 Graph Visualization System (D3.js Integration)
  - [x] 3.1 Create GraphViewer component with SVG container setup
  - [x] 3.2 Implement D3 data binding for nodes and edges rendering
  - [x] 3.3 Create Node component with circle rendering and label display
  - [x] 3.4 Create Edge component with line rendering and arrow support for directed graphs
  - [x] 3.5 Implement node selection visual feedback and highlighting
  - [x] 3.6 Add node "nibs/bumps" visual indicators for edge creation (integrated into edit mode)
  - [x] 3.7 Implement responsive SVG scaling and viewport management
  - [x] 3.8 Add visual feedback for edge creation preview line
  - [x] 3.9 Implement proper cleanup and memory management for D3 selections
  - [ ] 3.10 Add support for rendering up to 1000 nodes with performance optimization

- [ ] 4.0 Text Panel and Data Synchronization
  - [x] 4.1 Create TextPanel component with textarea for graph data display
  - [x] 4.2 Implement text format generation from graph data (Node Count, Graph Data, edges)
  - [x] 4.3 Implement two-textarea layout: read-only node count (top) and editable graph representation (bottom)
  - [x] 4.4 Add line numbers as visual indicators in the graph representation textarea
  - [x] 4.5 Implement debounced text parsing (0.5s delay) to update graph when text is modified
  - [skip] 4.6 Add text format parsing with validation (ignore invalid lines, continue processing)
  - [x] 4.7 Implement partial graph updates/merging when text is parsed (preserve existing data)
  - [x] 4.8 Add real-time text panel updates when graph is modified visually
  - [x] 4.9 Implement bidirectional synchronization between visual and text representations
  - [ ] 4.10 Add support for edge weight display in text format (empty string for unweighted edges)
  - [ ] 4.11 Preserve user-typed order in text representation (maintain as-is formatting)
  - [ ] 4.12 Ensure text panel serves as ground truth for graph data
  - [ ] 4.13 Implement proper text formatting and line break handling

- [ ] 5.0 User Interaction System
  - [x] 5.1 Implement mouse event handlers for node creation (left-click on empty space)
  - [x] 5.2 Add node selection/deselection on left-click
  - [x] 5.3 Implement node movement with click-and-drag functionality
  - [x] 5.4 Add edge creation by dragging from node nib to another node
  - [x] 5.5 Implement edge preview line during creation process
  - [x] 5.6 Add double-click handlers for node label editing
  - [x] 5.7 Add double-click handlers for edge weight editing
  - [x] 5.8 Implement node deletion on click in Delete mode
  - [x] 5.9 Implement edge deletion on click in Delete mode
  - [x] 5.10 Add proper event propagation and conflict resolution

- [x] 6.0 Mode Management and Controls
  - [x] 6.1 Create ModeControls component with Edit/Delete/View-Force buttons
  - [x] 6.4 Create GraphControls component for directed/undirected toggle
  - [x] 6.5 Add node indexing mode controls (0-indexed, 1-indexed, custom)
  - [x] 6.6 Implement mode-specific interaction behaviors
  - [x] 6.8 Ensure proper mode transitions and state cleanup

- [ ] 7.0 Undo/Redo System
  - [ ] 7.1 Create useUndoRedo hook for action history management
  - [ ] 7.2 Implement command pattern for all graph modification actions
  - [ ] 7.3 Add action tracking for node creation, deletion, label changes, position changes
  - [ ] 7.4 Add action tracking for edge creation, deletion, weight changes
  - [ ] 7.5 Implement circular buffer for history (max 50 actions)
  - [ ] 7.6 Create UndoRedoControls component with undo/redo buttons
  - [ ] 7.7 Add button state management (disabled when no actions available)
  - [ ] 7.8 Implement proper action serialization and deserialization
  - [ ] 7.9 Add memory management and cleanup for large action histories
  - [ ] 7.10 Ensure undo/redo works correctly with all interaction modes

- [ ] 8.0 Force Simulation and Layout
  - [x] 8.1 Integrate D3 force simulation for automatic node layout
  - [ ] 8.2 Configure force simulation parameters for optimal performance
  - [ ] 8.3 Implement force simulation activation in View/Force mode
  - [ ] 8.4 Add manual node repositioning during force simulation
  - [ ] 8.5 Implement force simulation pause/resume functionality
  - [ ] 8.6 Add collision detection to prevent node overlap
  - [ ] 8.7 Optimize force simulation for graphs up to 1000 nodes
  - [ ] 8.8 Add smooth transitions between manual and automatic layout
  - [ ] 8.9 Implement force simulation cleanup and memory management

- [ ] 9.0 Testing and Quality Assurance
  - [ ] 9.1 Write comprehensive unit tests for Graph model and all methods
  - [ ] 9.2 Add unit tests for all React components with user interaction scenarios
  - [ ] 9.3 Test all custom hooks (useGraph, useUndoRedo) with various state scenarios
  - [ ] 9.4 Add integration tests for text panel and visual graph synchronization
  - [ ] 9.5 Test undo/redo functionality with complex action sequences
  - [ ] 9.6 Add performance tests for large graphs (1000+ nodes)
  - [ ] 9.7 Test all interaction modes and mode transitions
  - [ ] 9.8 Add edge case testing for malformed data and error conditions
  - [ ] 9.9 Test force simulation with various graph configurations
  - [ ] 9.10 Ensure all 43 functional requirements are covered by tests

- [ ] 10.0 Performance Optimization and Final Integration
  - [ ] 10.1 Optimize D3 rendering performance for large graphs
  - [ ] 10.2 Implement efficient data binding and update patterns
  - [ ] 10.3 Add virtualization considerations for very large graphs
  - [ ] 10.4 Optimize force simulation parameters for responsive performance
  - [ ] 10.5 Add performance monitoring and debugging tools
  - [ ] 10.6 Implement proper memory cleanup and leak prevention
  - [ ] 10.7 Add error boundaries and graceful error handling
  - [ ] 10.8 Final integration testing of all components together
  - [ ] 10.9 Performance testing with 1000-node graphs
  - [ ] 10.10 Code review and final quality assurance
