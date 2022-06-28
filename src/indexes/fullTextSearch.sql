-- This file documents indexes created for FullTextSearch Queries that were not done using Prisma --
-- These indexes will have to be manually created on each deployment of a PostgreSQL Database     -- 

-- Extensions for Full Text Search GIN Indexes
CREATE EXTENSION pg_trgm;
CREATE EXTENSION btree_gin;

-- Project Full Text Search Indexes
CREATE INDEX project_name_index ON Project USING GIN (to_tsvector('english', name))
CREATE INDEX project_name_index ON User USING GIN (to_tsvector('english', name))
