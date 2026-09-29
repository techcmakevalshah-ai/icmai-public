create table if not exists public.students (
  id bigint generated always as identity primary key,
  course text not null check (course in ('foundation','intermediate')),
  serial_no integer,
  registration_number text not null unique,
  student_name text not null,
  mobile_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.students enable row level security;

revoke all on table public.students from anon, authenticated;
revoke all on sequence public.students_id_seq from anon, authenticated;

grant select, insert, update, delete on table public.students to authenticated;
grant usage, select on sequence public.students_id_seq to authenticated;

create index if not exists students_course_idx on public.students(course);
create index if not exists students_mobile_hash_idx on public.students(mobile_hash);
create index if not exists students_name_lower_idx on public.students(lower(student_name));

create or replace function public.search_students(search_term text)
returns table (
  registration_number text,
  student_name text,
  course text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  q text := trim(coalesce(search_term,''));
  digits text := regexp_replace(q, '[^0-9]', '', 'g');
  compact text := upper(regexp_replace(q, '\s+', '', 'g'));
  normalized_name text := upper(trim(regexp_replace(q, '\s+', ' ', 'g')));
begin
  if char_length(q) < 2 or char_length(q) > 80 then
    return;
  end if;

  if q ~ '^[0-9+() -]+$'
     and (char_length(digits) = 10 or (char_length(digits) = 12 and left(digits,2) = '91')) then
    return query
      select s.registration_number, s.student_name, s.course
      from public.students s
      where s.mobile_hash = encode(digest(right(digits,10),'sha256'),'hex')
      order by s.student_name
      limit 10;

  elsif compact ~ '^WF[A-Z0-9]{6,}$' or compact ~ '^[0-9]{11,}$' then
    return query
      select s.registration_number, s.student_name, s.course
      from public.students s
      where upper(s.registration_number) = compact
      order by s.student_name
      limit 10;

  else
    if char_length(normalized_name) < 4 then
      return;
    end if;

    return query
      select s.registration_number, s.student_name, s.course
      from public.students s
      where upper(trim(regexp_replace(s.student_name, '\s+', ' ', 'g'))) = normalized_name
      order by s.student_name
      limit 10;
  end if;
end;
$$;

revoke all on function public.search_students(text) from public;
grant execute on function public.search_students(text) to anon, authenticated;

drop policy if exists "admin_select_students" on public.students;
drop policy if exists "admin_insert_students" on public.students;
drop policy if exists "admin_update_students" on public.students;
drop policy if exists "admin_delete_students" on public.students;

create policy "admin_select_students"
on public.students for select to authenticated
using (lower(coalesce(auth.jwt()->>'email','')) = 'icmai.cmakevalshah@gmail.com');

create policy "admin_insert_students"
on public.students for insert to authenticated
with check (lower(coalesce(auth.jwt()->>'email','')) = 'icmai.cmakevalshah@gmail.com');

create policy "admin_update_students"
on public.students for update to authenticated
using (lower(coalesce(auth.jwt()->>'email','')) = 'icmai.cmakevalshah@gmail.com')
with check (lower(coalesce(auth.jwt()->>'email','')) = 'icmai.cmakevalshah@gmail.com');

create policy "admin_delete_students"
on public.students for delete to authenticated
using (lower(coalesce(auth.jwt()->>'email','')) = 'icmai.cmakevalshah@gmail.com');

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
