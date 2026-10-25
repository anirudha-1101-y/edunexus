

## 1. Core Philosophy

- Build simple, working, maintainable software.
- Write code that a human developer can easily understand, debug, and modify.
- Prefer straightforward solutions over clever or overly abstract solutions.
- Follow the existing project structure, coding style, and architecture.
- Do not overengineer. Implement only what the current task requires.
- Every line of code should have a clear purpose.
- Think like a practical developer, not a framework designer.
- Understand the problem before making changes.

## 2. Avoid Overengineering

- Do not create unnecessary files, folders, classes, functions, hooks, or components.
- Do not introduce design patterns unless there is a real need.
- Do not create abstractions for code that is used only once unless they clearly improve readability.
- Do not build generic, reusable systems for a single, simple feature.
- Do not add configuration files without a clear reason.
- Do not create extra layers between the UI, business logic, and database without a practical need.
- Avoid premature optimization.
- Do not implement features that were not requested.
- Do not refactor unrelated code while fixing a specific issue.
- Prefer a small, focused change over rewriting an entire module.
- Never create a separate utility for a trivial operation that can be clearly expressed inline.

## 3. Human-Written Code Standards

Write code that feels natural, readable, and practical.

- Use clear, descriptive names for variables, functions, components, and database fields.
- Keep functions focused on one understandable task.
- Avoid unnecessarily long functions, but do not split every few lines into separate functions.
- Use simple conditional statements and loops when they make the logic easier to understand.
- Avoid deeply nested conditions when a simple early return would work.
- Avoid clever one-liners that reduce readability.
- Do not use meaningless names such as `data1`, `temp2`, `handleStuff`, or `processThing`.
- Avoid excessive comments that simply repeat the code.
- Do not add comments to every line.
- Never write fake, overly formal, or AI-sounding comments.
- Do not add emojis to code comments, variable names, or logs.
- Keep comments short, natural, and useful.
- Do not add unnecessary JSDoc or documentation for obvious functions.
- Do not claim code is tested unless the relevant tests were actually executed.

## 4. Dependencies and Packages

- Prefer existing project dependencies and built-in language features.
- Do not install a package for a task that can be solved simply with existing tools.
- Never add a new dependency without explaining why it is necessary.
- Do not replace an existing library just because another library is popular.
- Avoid adding multiple libraries that solve the same problem.
- Do not upgrade unrelated packages.
- Preserve the existing package manager and lockfile.
- Ask before adding a large dependency or changing a major architectural decision.

## 5. Project Structure

- Inspect the existing project before creating or moving files.
- Follow the current folder and naming conventions.
- Place code where a developer would naturally expect to find it.
- Do not create folders simply to make the architecture look professional.
- Avoid excessive separation into `services`, `helpers`, `utils`, `managers`, `factories`, and similar folders.
- Create a new folder only when it provides a clear organizational benefit.
- Keep related functionality close together.
- Do not reorganize the project unless the task requires it.

## 6. JavaScript and React

- Prefer JavaScript and JSX unless the project already uses TypeScript or the task explicitly requires it.
- Follow the existing framework and component conventions.
- Use functional React components and hooks where appropriate.
- Do not create a component for every small piece of markup.
- Extract a component when it improves readability, reuse, or separation of responsibility.
- Avoid unnecessary `useEffect`, `useMemo`, and `useCallback`.
- Do not use effects for calculations that can be performed during rendering.
- Avoid prop drilling solutions or state-management libraries until there is a real problem.
- Keep state as close as practical to the components that use it.
- Use existing routing, form handling, and data-fetching patterns.
- Handle loading, error, empty, and success states where relevant.
- Do not introduce a new state-management library for a small feature.

## 7. Backend and API

- Keep API handlers straightforward and easy to follow.
- Validate user input at appropriate trust boundaries.
- Handle expected errors explicitly.
- Return consistent HTTP status codes and understandable responses.
- Keep business logic out of unnecessarily complicated controller layers.
- Do not create a service layer for every endpoint by default.
- Never trust client-provided roles, prices, ownership, or permissions.
- Keep secrets and private credentials on the server.
- Use environment variables for sensitive configuration.
- Do not expose stack traces, database credentials, or internal errors to clients.
- Add authentication and authorization checks wherever the operation requires them.
- Avoid unnecessary middleware and abstractions.

## 8. Database and ORM

- Understand the existing schema before modifying database-related code.
- Use clear table, column, model, and relation names.
- Define relationships and constraints according to actual business requirements.
- Use foreign keys and appropriate uniqueness constraints where necessary.
- Avoid duplicate data unless there is a deliberate reason to store it.
- Do not add database tables or columns without a real requirement.
- Avoid unnecessary joins, queries, and database round trips.
- Use transactions when multiple database changes must succeed or fail together.
- Never change or delete production data as part of an unapproved operation.
- Do not run destructive migrations without explicit approval.
- Follow the ORM already used by the project.
- Explain schema changes and migration commands before applying risky changes.

## 9. UI and Styling

- Follow the existing design system, colors, spacing, typography, and component patterns.
- Build responsive interfaces for relevant mobile, tablet, and desktop layouts.
- Prefer existing UI components over creating duplicates.
- Do not install another UI library when the existing stack is sufficient.
- Avoid unnecessary animations, gradients, shadows, and decorative elements.
- Prioritize usability, accessibility, consistency, and visual clarity.
- Use semantic HTML and meaningful button labels.
- Include appropriate loading, empty, error, and disabled states.
- Do not sacrifice maintainability for a flashy design.
- Avoid inline styles when the project already has a consistent styling approach.

## 10. Error Handling and Edge Cases

- Handle realistic edge cases related to the requested feature.
- Do not add defensive code for impossible scenarios without a reason.
- Avoid empty catch blocks and silently ignored errors.
- Show useful error messages without exposing sensitive implementation details.
- Prevent duplicate submissions where necessary.
- Validate inputs before performing important operations.
- Do not use hardcoded fallback values that hide real failures.
- Avoid adding excessive checks that make simple logic difficult to follow.

## 11. Security

- Never hardcode API keys, passwords, tokens, or other secrets.
- Never commit `.env` files containing real credentials.
- Validate and sanitize input where appropriate.
- Use parameterized database queries or the ORM's safe query mechanisms.
- Enforce permissions on the server, not only in the frontend.
- Avoid exposing sensitive personal information in logs or API responses.
- Do not weaken existing authentication, authorization, or validation to make a feature work.
- Do not disable security checks merely to bypass errors.

## 12. Debugging and Existing Code

- Read the relevant code before modifying it.
- Identify the actual cause of a bug instead of applying random fixes.
- Make the smallest change that correctly solves the problem.
- Preserve existing behavior unless a change is required.
- Do not suppress errors simply to make the application appear functional.
- Do not rewrite working code without a clear benefit.
- Remove temporary debugging logs before finishing, unless they serve a deliberate purpose.
- Never delete existing functionality without checking its purpose.

## 13. Testing and Verification

- Run the most relevant available checks after making changes.
- Prefer focused tests over running an unnecessarily large test suite for every small change.
- Check linting, builds, or type checks when available and relevant.
- Test important success and failure scenarios.
- If a check cannot run, explain why.
- Do not claim a build, test, or command succeeded without verifying its result.
- Do not add a testing framework solely for a tiny change unless requested or justified.
- Fix issues introduced by your changes before declaring the task complete.

## 14. AI Agent Workflow

Before making changes:

1. Understand the user's actual requirement.
2. Inspect the relevant files and existing implementation.
3. Identify the smallest practical solution.
4. Check whether existing code or dependencies already solve the problem.
5. Ask questions only when missing information would materially affect the implementation.

While making changes:

1. Modify only relevant files.
2. Follow existing conventions.
3. Keep the implementation simple and consistent.
4. Avoid unrelated refactoring and feature additions.
5. Do not overwrite user changes or remove existing functionality without a reason.

After making changes:

1. Summarize what changed.
2. Mention important files modified.
3. Explain any necessary setup or migration steps.
4. Report the checks actually performed and their results.
5. Mention known limitations or unfinished work honestly.

## 15. When to Ask Before Proceeding

Ask for approval before:

- Introducing a major new dependency.
- Changing the database architecture or authentication strategy.
- Performing destructive database operations.
- Deleting important files or existing functionality.
- Changing deployment configuration or production infrastructure.
- Making a large refactor outside the requested scope.
- Changing an established technology stack.

For small, reversible implementation decisions, use sensible defaults and continue without unnecessary questions.

## 16. Final Rule

The best solution is the simplest solution that correctly satisfies the requirements.

Do not make the project more complicated than it needs to be.

Write code that another developer can understand without needing an explanation from the AI that generated it.

**Simple. Clear. Secure. Maintainable. No unnecessary complexity.**

## 17. DBMS Architecture and Schema Rules

### A. Respect the Existing Database Design

- Before writing database code, inspect the existing database schema, models, migrations, and relationships.
- Understand the current database architecture before suggesting changes.
- Never assume that a table, column, relationship, or constraint exists without checking.
- Use PostgreSQL as the default database for new projects unless the project requirements specify another database.
- If the project already uses MySQL, MongoDB, or another database, respect the existing choice.
- Never switch databases or introduce another database without explicit approval.
- Keep the database design understandable and aligned with real-world requirements.

### B. Schema Design

- Design tables based on actual business entities and requirements.
- Use clear, consistent table and column names.
- Define an appropriate primary key for each table.
- Use foreign keys to establish relationships between related tables.
- Choose appropriate data types instead of using TEXT or VARCHAR for everything.
- Use NOT NULL, UNIQUE, CHECK, DEFAULT, and other constraints wherever business rules require them.
- Avoid storing multiple independent values in a single column.
- Avoid unnecessary duplicate columns and redundant data.
- Follow normalization principles, generally up to 3NF where appropriate.
- Do not blindly normalize every table if a justified business requirement calls for a different design.
- Never create unnecessary tables simply to make the schema appear enterprise-level.

### C. Table Relationships

Before implementing a relationship, identify its cardinality:

- One-to-One (1:1)
- One-to-Many (1:N)
- Many-to-Many (M:N)

Rules:

- Explain why a relationship is needed.
- Use foreign keys for enforceable relationships in relational databases.
- Implement many-to-many relationships through a junction table unless a justified alternative is appropriate.
- Define foreign key actions such as ON DELETE and ON UPDATE deliberately.
- Do not use CASCADE automatically without understanding its consequences.
- Avoid circular dependencies unless the business requirement justifies them.
- Ensure relationships reflect actual business rules rather than assumptions.
- Explain which table owns the foreign key and why.

### D. Explain the Schema Before Significant Changes

Because the developer is learning DBMS concepts, explain important database decisions before implementing them.

For a new table or a significant schema modification, provide:

1. Table name and its responsibility.
2. Columns, data types, and purpose.
3. Primary key and foreign keys.
4. Constraints and their purpose.
5. Relationships with other tables.
6. Relationship cardinality (1:1, 1:N, or M:N).
7. Relevant normalization considerations.
8. Required indexes and their purpose.
9. Migration or SQL commands needed.
10. Potential trade-offs or risks.

Keep explanations concise for simple changes. Do not produce a lengthy database design document for every minor query.

### E. ER Diagram and Relationships

- For a new multi-table feature, understand the entities and their relationships before implementing it.
- When useful, represent the schema using an ER diagram or Mermaid ER diagram.
- Show primary keys, foreign keys, and cardinality clearly.
- Ensure the diagram matches the actual database schema.
- Update the diagram when significant schema changes are made.
- Do not create diagrams or documentation that contradict the implementation.

### F. ORM and Database Access

- Use the ORM already configured in the project.
- Do not introduce a second ORM or database access library without approval.
- Understand how ORM models map to database tables and relationships.
- Keep model definitions consistent with the actual database schema.
- Do not assume ORM relations automatically guarantee database-level foreign key constraints; verify the generated schema and migrations.
- Avoid unnecessary ORM abstractions and repository layers.
- Use raw SQL only when it offers a clear benefit or is required by the project.
- Never mix ORM and raw SQL carelessly in ways that bypass important constraints or application logic.

### G. Migrations and Schema Changes

- Use version-controlled migrations for database schema changes when the project supports them.
- Inspect existing migrations before generating new ones.
- Never modify an already-applied migration casually.
- Never reset, drop, truncate, or overwrite a database without explicit approval.
- Do not use destructive schema synchronization commands on production data.
- Explain whether a migration is backward-compatible and whether it could affect existing records.
- Preserve existing data wherever possible.
- Never run production migrations or destructive database commands without authorization.

### H. Queries and Performance

- Write readable SQL and use meaningful aliases.
- Use parameterized queries or safe ORM query methods.
- Avoid SELECT * when only specific columns are required.
- Avoid N+1 query patterns.
- Add indexes based on actual query patterns, foreign key requirements, and measured or expected performance needs.
- Do not index every column unnecessarily.
- Consider composite indexes when queries frequently filter or sort using multiple columns.
- Understand transaction boundaries for operations that modify multiple related records.
- Use transactions when multiple changes must succeed or fail together.
- Do not introduce caching or database partitioning prematurely.

### I. Data Integrity and Business Rules

- Enforce critical data integrity rules at the database level when appropriate.
- Do not rely exclusively on frontend validation.
- Prevent invalid foreign key references and duplicate records where prohibited by business rules.
- Use appropriate numeric types for monetary values and avoid floating-point arithmetic for exact financial amounts.
- Handle timestamps and time zones consistently.
- Use transactions for operations that must remain consistent.
- Consider concurrency and duplicate submissions for critical operations.
- Never log passwords, tokens, or sensitive personal data.

### J. DBMS Learning Mode

The developer wants to understand and maintain control over database architecture.

Therefore:

- Explain important schema and relationship decisions in clear language.
- Distinguish between a database table, ORM model, entity, DTO, and application class.
- Explain why a foreign key, junction table, index, or constraint is needed when introducing one.
- Prefer practical SQL examples when they clarify a database decision.
- Do not hide database complexity behind unexplained abstractions.
- Do not automatically generate dozens of models without explaining their purpose.
- For major design decisions, present the proposed schema and relationships for review before implementation.
- For small, straightforward changes, explain briefly and proceed.
- Never assume the developer has approved a schema simply because the AI has proposed it.

### K. Final Database Verification

After a database-related change:

- Verify that model definitions and migrations agree.
- Check primary keys, foreign keys, constraints, and relationships.
- Run relevant migration validation or database tests when available.
- Check that existing functionality remains compatible.
- Report the commands actually executed and their results.
- Clearly identify any unverified database behavior.

**Final principle:** Design the database for the actual business requirements, keep relationships explicit, preserve data integrity, and make the architecture understandable to the developer.