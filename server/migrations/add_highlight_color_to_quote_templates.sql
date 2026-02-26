-- Migration: Add highlight_color to quote_templates
ALTER TABLE quote_templates ADD COLUMN highlight_color VARCHAR(7) DEFAULT '#fafafa';
