"use strict";
/**
 * Security utility for multi-tenant data isolation
 * Ensures all queries filter by company_id from PostgreSQL context
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCompanyOwnership = exports.getCompanyIdParam = exports.getCompanyIdFilter = void 0;
/**
 * Get current company ID from PostgreSQL session config
 * Used in WHERE clauses to enforce tenant isolation
 */
const getCompanyIdFilter = (tableAlias) => {
    const prefix = tableAlias ? `${tableAlias}.` : '';
    return `${prefix}company_id = current_setting('app.current_company_id')::bigint`;
};
exports.getCompanyIdFilter = getCompanyIdFilter;
/**
 * Get current company ID as a parameter
 * Useful for INSERT/UPDATE/DELETE operations
 */
const getCompanyIdParam = () => {
    return `current_setting('app.current_company_id')::bigint`;
};
exports.getCompanyIdParam = getCompanyIdParam;
/**
 * Validate that query result belongs to current company
 * Secondary check (first line of defense should be SQL WHERE clause)
 */
const validateCompanyOwnership = (row, currentCompanyId) => {
    if (!row)
        return false;
    const rowCompanyId = Number(row.company_id);
    const currentId = Number(currentCompanyId);
    return rowCompanyId === currentId;
};
exports.validateCompanyOwnership = validateCompanyOwnership;
