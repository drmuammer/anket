-- Enable RLS on surveys table
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all surveys" ON public.surveys;
DROP POLICY IF EXISTS "Admins can insert surveys" ON public.surveys;
DROP POLICY IF EXISTS "Admins can update surveys" ON public.surveys;
DROP POLICY IF EXISTS "Admins can delete surveys" ON public.surveys;
DROP POLICY IF EXISTS "Users can view surveys in their assigned units" ON public.surveys;

-- Policy: Admins can view all surveys
CREATE POLICY "Admins can view all surveys"
ON public.surveys FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Policy: Admins can insert surveys
CREATE POLICY "Admins can insert surveys"
ON public.surveys FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Policy: Admins can update surveys
CREATE POLICY "Admins can update surveys"
ON public.surveys FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Policy: Admins can delete surveys
CREATE POLICY "Admins can delete surveys"
ON public.surveys FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Policy: Users can view surveys in their assigned units
CREATE POLICY "Users can view surveys in their assigned units"
ON public.surveys FOR SELECT
USING (
    (
        -- User has permission for the unit
        EXISTS (
            SELECT 1 FROM public.unit_permissions
            WHERE unit_permissions.user_id = auth.uid()
            AND unit_permissions.unit_id = surveys.unit_id
        )
    ) OR (
        -- Or is an admin (redundant with the admin policy, but added for clarity)
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    )
);

-- Enable RLS on survey_responses table
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all survey responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Users can insert their own responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON public.survey_responses;

-- Policy: Admins can manage all survey responses (view, insert, update, delete)
CREATE POLICY "Admins can manage all survey responses"
ON public.survey_responses FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Policy: Users can insert their own responses
CREATE POLICY "Users can insert their own responses"
ON public.survey_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own responses
CREATE POLICY "Users can view their own responses"
ON public.survey_responses FOR SELECT
USING (auth.uid() = user_id); 