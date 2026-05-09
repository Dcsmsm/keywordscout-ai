-- Fix infinite recursion in admin RLS policies.
-- Root cause: "Admins can view all users" queried public.users to check
-- the admin role, which triggered the same policy again → infinite recursion.
-- Fix: use a SECURITY DEFINER function that bypasses RLS when checking role.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── users ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all users"   ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── subscriptions ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all subscriptions"   ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (public.is_admin());

-- ── usage ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all usage" ON public.usage;

CREATE POLICY "Admins can view all usage"
  ON public.usage FOR SELECT
  USING (public.is_admin());

-- ── keyword_analyses ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all analyses" ON public.keyword_analyses;

CREATE POLICY "Admins can view all analyses"
  ON public.keyword_analyses FOR SELECT
  USING (public.is_admin());

-- ── keyword_results ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all results" ON public.keyword_results;

CREATE POLICY "Admins can view all results"
  ON public.keyword_results FOR SELECT
  USING (public.is_admin());

-- ── serp_provider_configs ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage provider configs" ON public.serp_provider_configs;

CREATE POLICY "Admins can manage provider configs"
  ON public.serp_provider_configs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── serp_provider_logs ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view provider logs" ON public.serp_provider_logs;

CREATE POLICY "Admins can view provider logs"
  ON public.serp_provider_logs FOR SELECT
  USING (public.is_admin());

-- ── serp_raw_responses ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view raw responses" ON public.serp_raw_responses;

CREATE POLICY "Admins can view raw responses"
  ON public.serp_raw_responses FOR SELECT
  USING (public.is_admin());
