# Multi-Tenant Security Guidelines

## Quick Reference

When developing features in Honeycomb, ALWAYS remember:

> **Every SELECT, UPDATE, and DELETE must filter by company_id**

## Pattern: Safe Database Query Template

### Pattern 1: Simple SELECT

```typescript
// GET /api/jobs/:id
export const getOne = async (req: Request, res: Response) => {
  const db = (req as any).db;

  const { id } = req.params;

  const result = await db.query(
    `
    SELECT * FROM jobs
    WHERE id = $1 AND company_id = current_setting('app.current_company_id')::bigint
    `,
    [id],
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(result.rows[0]);
};
```

### Pattern 2: SELECT with JOIN

```typescript
// GET /api/assignments?job_id=123
export const getByJob = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const jobId = Number(req.query.job_id);

  const result = await db.query(
    `
    SELECT a.* FROM assignments a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.job_id = $1 AND j.company_id = current_setting('app.current_company_id')::bigint
    `,
    [jobId],
  );

  res.json(result.rows);
};
```

### Pattern 3: UPDATE with Safety Check

```typescript
// PUT /api/jobs/:id
export const update = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const { id } = req.params;
  const { title } = req.body;

  const result = await db.query(
    `
    UPDATE jobs
    SET title = $1
    WHERE id = $2 AND company_id = current_setting('app.current_company_id')::bigint
    RETURNING *
    `,
    [title, id],
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(result.rows[0]);
};
```

### Pattern 4: DELETE with Ownership Verification

```typescript
// DELETE /api/jobs/:id
export const remove = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const jobId = Number(req.params.id);

  // Verify ownership FIRST
  const check = await db.query(
    `SELECT id FROM jobs WHERE id = $1 AND company_id = current_setting('app.current_company_id')::bigint`,
    [jobId],
  );

  if (!check.rowCount) {
    return res.status(404).json({ error: "Not found" });
  }

  // Delete dependencies
  await db.query(`DELETE FROM assignments WHERE job_id = $1`, [jobId]);

  // Then delete main record
  await db.query(`DELETE FROM jobs WHERE id = $1`, [jobId]);

  res.json({ success: true });
};
```

## Checklist for Every Controller Function

Before submitting code, verify:

- [ ] **All SELECT/WHERE**: Include `AND company_id = current_setting('app.current_company_id')::bigint`
- [ ] **All UPDATE/WHERE**: Include company_id check to prevent unauthorized updates
- [ ] **All DELETE/WHERE**: Include company_id check + verify return rowCount
- [ ] **All JOINs**: Use subquery or explicit table join when querying dependent tables
- [ ] **Error Handling**: Return 404 for "not found" (not 403) to avoid info leaks
- [ ] **Test**: Try accessing resource with different company_id in header, should return 404

## PostgreSQL Config Variable Reference

The middleware `withDbContext` sets this variable:

```typescript
current_setting("app.current_company_id"); // Returns string, cast to bigint
```

### Database Type Conversion

```sql
-- Always cast when comparing
WHERE company_id = current_setting('app.current_company_id')::bigint

-- Or use int if company_id is int
WHERE company_id = current_setting('app.current_company_id')::int
```

## Common Mistakes to Avoid

### ❌ DON'T: Forget company_id filter

```typescript
// VULNERABLE
const result = await db.query(`SELECT * FROM jobs WHERE id = $1`, [id]);
```

### ❌ DON'T: Only check in frontend

```typescript
// Backend assumes frontend won't send bad requests
// This is NOT secure - backend must verify!
```

### ❌ DON'T: Use user.company_id from JWT alone

```typescript
// What if JWT is forged/tampered?
const company = req.user.company_id; // Don't trust this alone
```

### ❌ DON'T: Check company_id after returning data

```typescript
// VULNERABLE - data was already sent
const result = await db.query(`SELECT * FROM jobs WHERE id = $1`, [id]);
const company = result.rows[0].company_id;
if (company !== req.user.company_id) { ... }  // Too late!
```

### ✅ DO: Filter in the SQL query itself

```typescript
// SECURE - SQL prevents unauthorized data
const result = await db.query(
  `SELECT * FROM jobs WHERE id = $1 AND company_id = $2`,
  [id, req.user.company_id],
);
```

## Superadmin Impersonation Safety

When a superadmin uses `x-company-id` header to impersonate a company:

1. **Middleware sets**: `app.current_company_id` = header value
2. **All queries filter**: By this company_id automatically
3. **Result**: Superadmin sees ONLY the impersonated company's data
4. **Proof**: The company_id column in results matches the header value

This is **secure** because:

- Queries filter at database level (not code level)
- Multiple layers verify ownership
- PostgreSQL enforces the WHERE clause

## Code Review Criteria

When reviewing PRs with new controllers:

- [ ] Does every SELECT include company_id filter?
- [ ] Does every UPDATE include company_id check?
- [ ] Does every DELETE verify company ownership?
- [ ] Are dependent tables queried with proper JOINs?
- [ ] Does the code handle 404 correctly (return early)?
- [ ] No data is processed/returned before ownership check?

## Questions?

If unsure about multi-tenancy:

1. Review existing patterns in `jobs.controller.ts`
2. Check `SECURITY_FIX_CHANGELOG.md` for examples
3. Follow the templates above exactly
4. Ask before merging if uncertain

---

**Remember**: Database isolation is your friend. Use it!
