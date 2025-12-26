-- Create RPC function to increment connection count
-- This ensures atomic increment operation to prevent race conditions

CREATE OR REPLACE FUNCTION increment_connection_count(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET connection_count = COALESCE(connection_count, 0) + 1
  WHERE id = user_id;
END;
$$;

-- Create RPC function to decrement connection count
-- This ensures atomic decrement operation and prevents negative values

CREATE OR REPLACE FUNCTION decrement_connection_count(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET connection_count = GREATEST(COALESCE(connection_count, 0) - 1, 0)
  WHERE id = user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_connection_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_connection_count(UUID) TO authenticated;
