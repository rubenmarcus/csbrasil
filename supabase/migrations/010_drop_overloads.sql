-- Migration 010: remove OVERLOADS de submit_match (bug "Could not choose the
-- best candidate function") e recria só a assinatura atual (12 params, com p_ip).
do $$
declare f record;
begin
  for f in select p.oid::regprocedure::text as sig
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where p.proname = 'submit_match' and n.nspname = 'public'
  loop
    execute 'drop function if exists ' || f.sig || ' cascade';
  end loop;
end $$;

-- depois deste bloco, recrie o _flag e o submit_match do schema.sql atual
-- (o schema.sql inteiro já contém o drop acima — rodar ele resolve tudo)
