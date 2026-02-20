/**
 * Security utility for multi-tenant data isolation
 * Ensures all queries filter by company_id from PostgreSQL context
 */

/**
 * Get current company ID from PostgreSQL session config
 * Used in WHERE clauses to enforce tenant isolation
 */
export const getCompanyIdFilter = (tableAlias?: string) => {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  return `${prefix}company_id = current_setting('app.current_company_id')::bigint`;
};

/**
 * Get current company ID as a parameter
 * Useful for INSERT/UPDATE/DELETE operations
 */
export const getCompanyIdParam = () => {
  return `current_setting('app.current_company_id')::bigint`;
};

/**
 * Validate that query result belongs to current company
 * Secondary check (first line of defense should be SQL WHERE clause)
 */
export const validateCompanyOwnership = (
  row: any,
  currentCompanyId: string | number
): boolean => {
  if (!row) return false;
  const rowCompanyId = Number(row.company_id);
  const currentId = Number(currentCompanyId);
  return rowCompanyId === currentId;
};
