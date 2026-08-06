-- Add partial index for efficient owned list count queries
-- Used by: ListService.getListQuota(), ListService.createList(), ListRepository.countOwnedLists()
-- Query pattern: SELECT COUNT(*) FROM shopping_lists WHERE created_by_user_id = ? AND deleted_at IS NULL

CREATE INDEX IF NOT EXISTS idx_shopping_lists_active_owner
ON shopping_lists(created_by_user_id)
WHERE deleted_at IS NULL;
