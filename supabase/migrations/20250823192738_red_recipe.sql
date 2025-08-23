/*
  # Add comprehensive logging and monitoring

  1. Logging Functions
    - Add audit logging for all critical operations
    - Add performance monitoring
    - Add error tracking

  2. Monitoring Views
    - Create views for system health monitoring
    - Add usage analytics
    - Add performance metrics

  3. Security Enhancements
    - Add additional security checks
    - Improve error handling
    - Add rate limiting preparation
*/

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  duration_ms integer NOT NULL,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create system health table
CREATE TABLE IF NOT EXISTS system_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component text NOT NULL,
  status text NOT NULL CHECK (status IN ('healthy', 'warning', 'error')),
  message text,
  metrics jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_operation ON performance_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_component ON system_health(component);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(status);
CREATE INDEX IF NOT EXISTS idx_system_health_created_at ON system_health(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@pba.com'::text, 'admin@example.com'::text]));

-- RLS Policies for performance_metrics (admin only)
CREATE POLICY "Admins can view performance metrics"
  ON performance_metrics
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@pba.com'::text, 'admin@example.com'::text]));

-- RLS Policies for system_health (admin only)
CREATE POLICY "Admins can view system health"
  ON system_health
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@pba.com'::text, 'admin@example.com'::text]));

-- Create audit logging function
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id uuid,
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create performance logging function
CREATE OR REPLACE FUNCTION log_performance_metric(
  p_operation text,
  p_duration_ms integer,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO performance_metrics (
    operation,
    duration_ms,
    success,
    error_message,
    metadata
  ) VALUES (
    p_operation,
    p_duration_ms,
    p_success,
    p_error_message,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create system health logging function
CREATE OR REPLACE FUNCTION log_system_health(
  p_component text,
  p_status text,
  p_message text DEFAULT NULL,
  p_metrics jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO system_health (
    component,
    status,
    message,
    metrics
  ) VALUES (
    p_component,
    p_status,
    p_message,
    p_metrics
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers for critical tables
CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      auth.uid(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_battles_trigger ON battles;
CREATE TRIGGER audit_battles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON battles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create monitoring views
CREATE OR REPLACE VIEW system_overview AS
SELECT 
  'profiles' as component,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as created_today,
  COUNT(*) FILTER (WHERE plan = 'premium') as premium_users
FROM profiles
UNION ALL
SELECT 
  'battles' as component,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as created_today,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_battles
FROM battles;

CREATE OR REPLACE VIEW performance_summary AS
SELECT 
  operation,
  COUNT(*) as total_calls,
  AVG(duration_ms) as avg_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  MIN(duration_ms) as min_duration_ms,
  COUNT(*) FILTER (WHERE success = false) as error_count,
  (COUNT(*) FILTER (WHERE success = true)::float / COUNT(*) * 100) as success_rate
FROM performance_metrics
WHERE created_at > now() - interval '24 hours'
GROUP BY operation
ORDER BY total_calls DESC;

-- Grant permissions to authenticated users for monitoring views
GRANT SELECT ON system_overview TO authenticated;
GRANT SELECT ON performance_summary TO authenticated;

-- Add RLS to monitoring views (admin only)
CREATE POLICY "Admins can view system overview"
  ON system_overview
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@pba.com'::text, 'admin@example.com'::text]));

CREATE POLICY "Admins can view performance summary"
  ON performance_summary
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@pba.com'::text, 'admin@example.com'::text]));

-- Create cleanup function for old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs() RETURNS void AS $$
BEGIN
  -- Keep audit logs for 90 days
  DELETE FROM audit_logs WHERE created_at < now() - interval '90 days';
  
  -- Keep performance metrics for 30 days
  DELETE FROM performance_metrics WHERE created_at < now() - interval '30 days';
  
  -- Keep system health logs for 7 days
  DELETE FROM system_health WHERE created_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log initial system health
SELECT log_system_health('database', 'healthy', 'Comprehensive logging system initialized');