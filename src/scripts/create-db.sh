psql -U ends -d postgres -c 'CREATE DATABASE ends;'
psql -U ends -d ends < src/db/db.sql
