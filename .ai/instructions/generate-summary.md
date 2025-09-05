# Rule: Generating Chat Summaries

## Goal

To provide a concise summary (~200 words) of the current chat conversation that can be pasted into a new chat window when starting implementation tasks.

## Process

1. **Analyze Chat History**: Review the entire conversation to identify key points, decisions made, and deliverables created
2. **Identify Project Context**: Determine the main project or task being discussed
3. **Extract Key Information**: Capture requirements, technical decisions, file paths, and next steps
4. **Generate Summary**: Create a structured summary with clear sections covering:
   - Project Overview
   - Key Requirements/Decisions
   - Deliverables Created
   - Implementation Approach
   - Next Steps
5. Save this to `.ai/summary.md` file

## Output Format

The summary should be structured as follows:

```markdown
# Chat Summary: [Project/Task Name]

## Project Overview
[Brief description of what was accomplished]

## Key Requirements/Decisions
- [Key point 1]
- [Key point 2]
- [Key point 3]

## Deliverables Created
1. **[File Name]**: [Brief description]
2. **[File Name]**: [Brief description]

## Implementation Approach
[Description of how the solution was structured or planned]

## Next Steps
[What should be done next or what's ready to begin]
```

## Usage

To generate a summary, simply ask: "Generate a chat summary" or "Create a summary of this conversation"

## Target Audience

The summary is intended for the user to paste into a new chat window when they want to continue working on the same project or task, providing context for the AI assistant.
