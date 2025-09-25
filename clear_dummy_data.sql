-- Clear all dummy data from the loads table
-- This will remove all test data but keep the table structure

-- Delete all records from the loads table
DELETE FROM loads;

-- Reset the sequence (auto-increment) to start from 1 again
-- This ensures new records start with ID 1
ALTER SEQUENCE loads_id_seq RESTART WITH 1;

-- Optional: Verify the table is empty
-- SELECT COUNT(*) FROM loads; -- Should return 0

-- Optional: Check table structure is still intact
-- \d loads -- Shows table structure

-- Optional: Show current sequence value
-- SELECT last_value FROM loads_id_seq;
