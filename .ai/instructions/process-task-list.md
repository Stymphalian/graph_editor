# Task List Management

Guidelines for managing task lists in markdown files to track progress on completing a PRD

## Task Implementation
- Do **one sub-task at a time**. Do **NOT** start the next sub-task until you ask the user for permission and they say "yes" or "y".
- After implementing all the changes for a **sub-task** prompt the User to check over your implementation and wait for a "yes" or "y"
- Once the User has given the go-ahead on the **sub-task** mark it as completed by changing `[ ]` to `[x]` and run the `Completion Protocol` instructions outline below.
- If **ALL** the sub-tasks underneath a parent tasks are completed(i.e `[x]`) mark
  the **parent task** as completed with an `[x]` and run the `Completion Protocol`
- **ALWAYS** stop after each sub-task and wait for the user's go-ahead.

## Completion Protocol
   - **First**: Run the full test suite (`pytest`, `npm test`, `bin/rails test`, etc.)
   - **Only if all tests pass**: Stage changes (`git add .`)
   - **Clean up**: Remove any temporary files and temporary code before committing
   - **Commit**: Use a descriptive commit message that:
   - Uses conventional commit format (`feat:`, `fix:`, `refactor:`, etc.)
   - Summarizes what was accomplished in the parent task
   - Lists key changes and additions
   - References the task number and PRD context
   - **Formats the message as a single-line command using `-m` flags**, e.g.:
      ```
      git commit -m "feat: add payment validation logic" -m "- Validates card type and expiry" -m "- Adds unit tests for edge cases" -m "Related to T123 in PRD"
      ```

## Task List Maintenance

1. **Update the task list as you work:**
   - Mark tasks and subtasks as completed (`[x]`) per the protocol above.
   - Add new tasks as they emerge.

2. **Maintain the "Relevant Files" section:**
   - List every file created or modified.
   - Give each file a one‑line description of its purpose.

## AI Instructions

When working with task lists, the AI must:

1. Regularly update the task list file after finishing any significant work.
2. Follow the completion protocol:
   - Mark each finished **sub‑task** `[x]`.
   - Mark the **parent task** `[x]` once **all** its subtasks are `[x]`.
3. Add newly discovered tasks.
4. Keep "Relevant Files" accurate and up to date.
5. Before starting work, check which sub‑task is next.
6. After implementing a sub‑task, update the file and then pause for user approval.