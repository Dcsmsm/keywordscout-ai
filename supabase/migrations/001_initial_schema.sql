-- ============================================================
-- KeywordScout Initial Schema
-- ============================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_user_id_idx on public.subscriptions(user_id);

-- ============================================================
-- USAGE
-- ============================================================
create table public.usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  month text not null, -- format: YYYY-MM
  analyses_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, month)
);

-- ============================================================
-- KEYWORD ANALYSES
-- ============================================================
create table public.keyword_analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  seed_keyword text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  provider_used text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index keyword_analyses_user_id_idx on public.keyword_analyses(user_id);
create index keyword_analyses_created_at_idx on public.keyword_analyses(created_at desc);

-- ============================================================
-- KEYWORD RESULTS
-- ============================================================
create table public.keyword_results (
  id uuid primary key default uuid_generate_v4(),
  analysis_id uuid not null references public.keyword_analyses(id) on delete cascade,
  keyword text not null,
  estimated_volume integer,
  intent text check (intent in ('informational', 'navigational', 'commercial', 'transactional')),
  difficulty_estimate integer check (difficulty_estimate between 0 and 100),
  serp_weakness_score integer check (serp_weakness_score between 0 and 100),
  opportunity_score integer check (opportunity_score between 0 and 100),
  suggested_title text,
  content_angle text,
  topic_cluster text,
  serp_features jsonb,
  raw_serp_data jsonb,
  created_at timestamptz not null default now()
);

create index keyword_results_analysis_id_idx on public.keyword_results(analysis_id);
create index keyword_results_opportunity_score_idx on public.keyword_results(opportunity_score desc);

-- ============================================================
-- SERP PROVIDER CONFIGS
-- ============================================================
create table public.serp_provider_configs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  provider_key text not null check (provider_key in ('serpapi', 'serper', 'dataforseo', 'mock')),
  is_active boolean not null default false,
  is_fallback boolean not null default false,
  api_key_encrypted text,
  config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed default mock provider
insert into public.serp_provider_configs (name, provider_key, is_active, is_fallback)
values ('Mock Provider', 'mock', true, false);

-- ============================================================
-- SERP PROVIDER LOGS
-- ============================================================
create table public.serp_provider_logs (
  id uuid primary key default uuid_generate_v4(),
  provider_key text not null,
  query text not null,
  status text not null check (status in ('success', 'error', 'timeout')),
  latency_ms integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index serp_provider_logs_provider_key_idx on public.serp_provider_logs(provider_key);
create index serp_provider_logs_created_at_idx on public.serp_provider_logs(created_at desc);

-- ============================================================
-- SERP RAW RESPONSES
-- ============================================================
create table public.serp_raw_responses (
  id uuid primary key default uuid_generate_v4(),
  log_id uuid not null references public.serp_provider_logs(id) on delete cascade,
  response_data jsonb not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

create trigger usage_updated_at
  before update on public.usage
  for each row execute function public.handle_updated_at();

create trigger keyword_analyses_updated_at
  before update on public.keyword_analyses
  for each row execute function public.handle_updated_at();

create trigger serp_provider_configs_updated_at
  before update on public.serp_provider_configs
  for each row execute function public.handle_updated_at();

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Increment usage counter
create or replace function public.increment_usage(p_user_id uuid, p_month text)
returns void as $$
begin
  insert into public.usage (user_id, month, analyses_count)
  values (p_user_id, p_month, 1)
  on conflict (user_id, month)
  do update set
    analyses_count = public.usage.analyses_count + 1,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage enable row level security;
alter table public.keyword_analyses enable row level security;
alter table public.keyword_results enable row level security;
alter table public.serp_provider_configs enable row level security;
alter table public.serp_provider_logs enable row level security;
alter table public.serp_raw_responses enable row level security;

-- USERS policies
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all users"
  on public.users for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- SUBSCRIPTIONS policies
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Admins can view all subscriptions"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all subscriptions"
  on public.subscriptions for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- USAGE policies
create policy "Users can view own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "Admins can view all usage"
  on public.usage for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- KEYWORD ANALYSES policies
create policy "Users can view own analyses"
  on public.keyword_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.keyword_analyses for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all analyses"
  on public.keyword_analyses for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- KEYWORD RESULTS policies
create policy "Users can view own results"
  on public.keyword_results for select
  using (
    exists (
      select 1 from public.keyword_analyses
      where id = analysis_id and user_id = auth.uid()
    )
  );

create policy "Admins can view all results"
  on public.keyword_results for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- SERP PROVIDER CONFIGS policies (admin only)
create policy "Admins can manage provider configs"
  on public.serp_provider_configs for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- SERP PROVIDER LOGS policies (admin only)
create policy "Admins can view provider logs"
  on public.serp_provider_logs for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- SERP RAW RESPONSES policies (admin only)
create policy "Admins can view raw responses"
  on public.serp_raw_responses for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
