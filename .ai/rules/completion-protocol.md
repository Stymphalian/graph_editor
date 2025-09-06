# Completion Protocol Rule

## CRITICAL: Always follow this exact sequence for task completion

### Step 1: Ask for Permission
- After implementing a sub-task, ALWAYS ask the user: "Please review the implementation and let me know if you'd like me to proceed with the next sub-task or if you'd like any modifications to the current implementation."
- DO NOT proceed to git operations until user gives explicit confirmation

### Step 2: Wait for User Confirmation
- Wait for user to say "yes", "y", or give explicit approval
- DO NOT assume approval or proceed without confirmation

### Step 3: Only After Confirmation - Run Completion Protocol
1. **First**: Run the full test suite (`npm test`, `pytest`, `bin/rails test`, etc.)
2. **Only if all tests pass**: Stage changes (`git add .`)
3. **Clean up**: Remove any temporary files and temporary code before committing
4. **Commit**: Use a descriptive commit message that:
   - Uses conventional commit format (`feat:`, `fix:`, `refactor:`, etc.)
   - Summarizes what was accomplished in the parent task
   - Lists key changes and additions
   - References the task number and PRD context
   - **Formats the message as a single-line command using `-m` flags**

### Step 4: Update Task List
- Mark the completed sub-task as `[x]`
- Update the task list file

## NEVER skip Step 1 and 2!
## ALWAYS ask for permission before git operations!
