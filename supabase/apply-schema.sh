#!/bin/bash

# Supabase proje bilgileri
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_service_role_key"

# SQL dosyasını Supabase'e gönder
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d @schema.sql

echo "Veritabanı şeması uygulandı!" 