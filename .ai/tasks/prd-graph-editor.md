# Product Requirements Document: Web-Based Graph Editor

## Introduction/Overview

This document outlines the requirements for a web-based graph editor application designed to help developers create and visualize graphs for testing graph algorithms. The application will provide an intuitive interface for creating, editing, and visualizing both directed and undirected graphs with interactive features and real-time synchronization between visual and text representations.

## Goals

1. **Primary Goal**: Create a tool that enables efficient creation and manipulation of graphs for algorithm testing
2. **Usability Goal**: Provide an intuitive interface that requires minimal learning curve
3. **Performance Goal**: Support graphs with up to 1000 nodes while maintaining responsive interactions
4. **Flexibility Goal**: Support both directed and undirected graphs with customizable node labels and edge weights
5. **Synchronization Goal**: Maintain real-time sync between visual graph representation and text data format

## User Stories

1. **As a developer**, I want to quickly create a graph by clicking on empty space to add nodes, so that I can rapidly prototype test cases for my algorithms.

2. **As a developer**, I want to connect nodes by dragging from one node to another, so that I can easily create edges without complex UI interactions.

3. **As a developer**, I want to switch between directed and undirected graph modes, so that I can test different types of graph algorithms.

4. **As a developer**, I want to see a text representation of my graph that updates in real-time, so that I can easily copy the data for use in my algorithm implementations.

5. **As a developer**, I want to edit node labels and edge weights by double-clicking, so that I can customize my test data without recreating the graph.

6. **As a developer**, I want to use a force simulation to automatically organize my graph layout, so that I can quickly see the overall structure of complex graphs.

7. **As a developer**, I want to delete nodes and edges easily, so that I can quickly modify my test cases.

8. **As a developer**, I want to undo and redo my actions, so that I can experiment with different graph configurations without fear of losing work.

## Functional Requirements

### Core Graph Management
1. The system must support graphs with up to 1000 nodes
2. The system must support both directed and undirected graphs
3. The system must provide a toggle button to switch between directed and undirected modes
4. The system must maintain an abstraction layer that serves as the single source of truth for graph data
5. The system must support real-time bidirectional synchronization between visual and text representations

### Node Management
6. The system must allow users to add nodes by left-clicking on empty space in the viewport
7. The system must display nodes as circles with labels
8. The system must support 0-indexed node labels by default (0, 1, 2, ...)
9. The system must allow users to choose between 0-indexed, 1-indexed, or custom string labels
10. The system must allow users to edit node labels by double-clicking on nodes
11. The system must allow users to select/deselect nodes by left-clicking
12. The system must allow users to move nodes by click-and-drag in Edit and Delete modes
13. The system must delete nodes and all connected edges when clicked in Delete mode

### Edge Management
14. The system must display edges as line segments between nodes
15. The system must display directed edges with arrows
16. The system must display undirected edges as simple line segments
17. The system must allow users to create edges by clicking on node "nibs/bumps" and dragging to another node
18. The system must show a preview line while creating edges
19. The system must support edge weights as string values
20. The system must allow users to edit edge weights by double-clicking on edges
21. The system must allow users to delete edges by left-clicking in Delete mode

### Interaction Modes
22. The system must provide three distinct modes: Edit, Delete, and View/Force
23. The system must provide mode toggle buttons in the UI
24. The system must allow node movement in all three modes
25. The system must run force simulation in View/Force mode to automatically organize nodes
26. The system must allow manual node repositioning during force simulation

### Text Data Panel
27. The system must display a left panel with text representation of the graph
28. The system must use the specified text format:
   - Node Count: [number]
   - Graph Data: [list of node labels]
   - [edge definitions as "source target" or "source target weight"]
29. The system must update the text panel in real-time when graph is modified visually
30. The system must update the visual graph when text panel is modified
31. The system must treat the text panel as the ground truth for graph data

### User Interface
32. The system must use SVG or vector-based graphics for rendering
33. The system must provide a central viewport for graph visualization
34. The system must provide clear visual feedback for node selection
35. The system must provide visual indicators for node "nibs/bumps" for edge creation
36. The system must maintain responsive performance with up to 1000 nodes

### Undo/Redo Functionality
37. The system must maintain a history of all graph modifications
38. The system must provide an undo button that reverts the most recent action
39. The system must provide a redo button that reapplies the most recently undone action
40. The system must track the following actions in the history:
    - Node creation
    - Node deletion
    - Node label changes
    - Node position changes
    - Edge creation
    - Edge deletion
    - Edge weight changes
41. The system must disable undo/redo buttons when no actions are available
42. The system must limit history to the last 50 actions to prevent memory issues

## Non-Goals (Out of Scope)

1. **Backend Integration**: No server-side functionality or data persistence
2. **File Management**: No save/load file functionality
3. **Multiple Graph Support**: Only one graph per session
4. **Collaborative Features**: No real-time collaboration or sharing
5. **Advanced Layout Algorithms**: Only basic force simulation for auto-layout
6. **Graph Analysis Tools**: No built-in algorithm implementations or analysis features
7. **Export Formats**: Only the specified text format, no JSON/GraphML export
8. **Advanced Undo/Redo**: No branching undo history or selective undo
9. **Graph Validation**: No validation of graph properties or constraints

## Design Considerations

### Visual Design
- Use clean, minimal interface with clear mode indicators
- Ensure nodes are large enough to be easily clickable (minimum 20px diameter)
- Use distinct colors for different modes (Edit: blue, Delete: red, View/Force: green)
- Provide clear visual feedback for all interactive elements

### Layout
- Left panel: 300px width for text data
- Main viewport: remaining space for graph visualization
- Mode buttons: horizontal row at top of interface
- Toggle buttons: grouped together for graph type and node indexing
- Undo/Redo buttons: positioned near mode buttons for easy access

### Accessibility
- Ensure sufficient color contrast for all UI elements
- Provide keyboard shortcuts for mode switching (optional)
- Make interactive elements large enough for easy targeting

## Technical Considerations

### Technology Stack
- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Graphics**: D3.js for SVG rendering and force simulation
- **State Management**: React Context or Redux for graph data management
- **Build Tool**: Vite (requires Node.js 20.19+ or 22.12+)

### Architecture
- Implement a Graph data model as the single source of truth
- Create separate view components for visual graph and text panel
- Use D3's force simulation for automatic layout
- Implement event handlers for all mouse interactions
- Use React hooks for state management and side effects
- Implement a command pattern for undo/redo functionality
- Maintain a circular buffer for action history (max 50 actions)

### Performance
- Implement efficient rendering for large graphs (up to 1000 nodes)
- Use D3's data binding for optimal SVG updates
- Consider virtualization for very large graphs if needed
- Optimize force simulation parameters for responsive performance

## Success Metrics

1. **Functionality**: All 43 functional requirements are implemented and working
2. **Performance**: Application remains responsive with 1000-node graphs
3. **Usability**: User can create a 10-node graph with 15 edges in under 2 minutes
4. **Synchronization**: Text and visual representations stay in perfect sync
5. **Stability**: No crashes or data loss during normal usage
6. **Undo/Redo**: All tracked actions can be undone and redone correctly

## Open Questions

1. Should there be any keyboard shortcuts for common operations? no
2. Should the force simulation be configurable (strength, iterations, etc.)? no
3. Should there be any visual indicators for graph statistics (node count, edge count)? no
4. Should the application remember the last used mode between sessions? no
5. Should there be any visual feedback when switching between directed/undirected modes? no

---

**Document Version**: 1.0  
**Created**: [Current Date]  
**Target Audience**: Junior Developer  
**Estimated Implementation Time**: 2-3 weeks
