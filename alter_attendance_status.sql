-- Remove the existing check constraint
ALTER TABLE public.attendance_logs
DROP CONSTRAINT attendance_logs_status_check;

-- Add the new check constraint including 'cancelled'
ALTER TABLE public.attendance_logs
ADD CONSTRAINT attendance_logs_status_check 
CHECK (status IN ('present', 'absent', 'cancelled'));
