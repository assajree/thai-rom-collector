## AI Workflow -- Spec-driven development

Use the full workflow in `rules/ai-workflow.md` only when the user explicitly requests it. Otherwise, proceed directly to implementation regardless of change size or scope.

### AGENTS.md content-splitting rule

Split a section out of this file into its own `rules/*.md` file (referenced back with a plain backtick path, e.g. `` `rules/foo.md` `` — not an `@`-import, which auto-loads into every session's context and wastes tokens on unrelated tasks) when **both** of these hold:

- **Append-only / growing** — the section is a running log of learnings (e.g. gotchas discovered from live deploy errors) rather than a fixed, stable rule.
- **Not relevant to every task** — it only matters for a specific sub-area of work (e.g. HANA SQLScript syntax), not the project as a whole.

Keep a section inline in `AGENTS.md` when it's short and stable (a one-off convention or constraint that doesn't keep growing) and broadly relevant to most tasks in this repo — splitting those out just fragments the file without saving tokens.

## Async Task Feedback

For any task that performs asynchronous processing or changes user data—such as save, import/export, delete, upload, or similar operations—provide visible toast/status feedback for the full operation:

- Show a progress message before starting the awaited operation, using wording such as `กำลัง...`.
- Show a success message after the operation completes successfully, using the shared success tone so the message is displayed in green.
- If the operation fails, show an error message and do not show a success message.
- Disable the triggering button or control while the operation is running to prevent duplicate submissions.
- Use `finally` to restore loading/busy state regardless of success or failure.
