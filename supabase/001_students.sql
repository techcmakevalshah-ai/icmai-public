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

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table if not exists private.student_lookup (
  registration_number text primary key,
  student_name text not null,
  course text not null check (course in ('foundation','intermediate')),
  mobile_hash text
);

revoke all on table private.student_lookup from public;
grant select on table private.student_lookup to anon, authenticated;

insert into private.student_lookup (registration_number, student_name, course, mobile_hash)
select registration_number, student_name, course, mobile_hash
from public.students
on conflict (registration_number) do update
set student_name = excluded.student_name,
    course = excluded.course,
    mobile_hash = excluded.mobile_hash;

create or replace function private.sync_student_lookup()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if TG_OP = 'DELETE' then
    delete from private.student_lookup
    where registration_number = OLD.registration_number;
    return OLD;
  end if;

  if TG_OP = 'UPDATE' and OLD.registration_number is distinct from NEW.registration_number then
    delete from private.student_lookup
    where registration_number = OLD.registration_number;
  end if;

  insert into private.student_lookup (registration_number, student_name, course, mobile_hash)
  values (NEW.registration_number, NEW.student_name, NEW.course, NEW.mobile_hash)
  on conflict (registration_number) do update
  set student_name = excluded.student_name,
      course = excluded.course,
      mobile_hash = excluded.mobile_hash;

  return NEW;
end;
$$;

revoke all on function private.sync_student_lookup() from public, anon, authenticated;

drop trigger if exists sync_student_lookup_trigger on public.students;
create trigger sync_student_lookup_trigger
after insert or update or delete on public.students
for each row execute function private.sync_student_lookup();

create or replace function public.search_students(search_term text)
returns table (
  registration_number text,
  student_name text,
  course text
)
language plpgsql
security invoker
set search_path = public, private
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
      from private.student_lookup s
      where s.mobile_hash = encode(extensions.digest(right(digits,10),'sha256'),'hex')
      order by s.student_name
      limit 10;

  elsif compact ~ '^WF[A-Z0-9]{6,}$' or compact ~ '^[0-9]{11,}$' then
    return query
      select s.registration_number, s.student_name, s.course
      from private.student_lookup s
      where upper(s.registration_number) = compact
      order by s.student_name
      limit 10;

  else
    if char_length(normalized_name) < 4 then
      return;
    end if;

    return query
      select s.registration_number, s.student_name, s.course
      from private.student_lookup s
      where upper(trim(regexp_replace(s.student_name, '\s+', ' ', 'g'))) = normalized_name
      order by s.student_name
      limit 10;
  end if;
end;
$$;

revoke all on function public.search_students(text) from public;
grant execute on function public.search_students(text) to anon, authenticated;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
