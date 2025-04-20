-- Create unit_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.unit_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, unit_id)
);

-- Enable RLS on unit_permissions
ALTER TABLE public.unit_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for unit_permissions
-- 1. Admin can see all permissions
DROP POLICY IF EXISTS "Admins can view all unit permissions" ON public.unit_permissions;
CREATE POLICY "Admins can view all unit permissions"
ON public.unit_permissions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- 2. Users can only see their own permissions
DROP POLICY IF EXISTS "Users can view their own unit permissions" ON public.unit_permissions;
CREATE POLICY "Users can view their own unit permissions"
ON public.unit_permissions FOR SELECT
USING (user_id = auth.uid());

-- 3. Only admins can insert, update, or delete permissions
DROP POLICY IF EXISTS "Admins can manage unit permissions" ON public.unit_permissions;
CREATE POLICY "Admins can manage unit permissions"
ON public.unit_permissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
); 