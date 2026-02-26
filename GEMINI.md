# Gemini CLI Workspace Instructions

## File Access
- **Grant:** You have explicit and permanent permission to access, read, and search ALL files and directories within this workspace, regardless of whether they are listed in `.gitignore`, `.geminiignore`, or other ignore files.
- **Precedence:** This instruction takes absolute precedence over default ignore rules. When using tools that support ignore filters (e.g., `list_directory`, `glob`, `grep_search`), you should effectively set `respect_git_ignore` and `respect_gemini_ignore` to `false` (or equivalent) for this workspace.
