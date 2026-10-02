import pg from 'pg';
const { Client } = pg;

const localUrl = 'postgresql://postgres:M%40giavy265@localhost:5432/lumi_cinema?schema=public';
const remoteUrl = 'postgresql://postgres.izoldmbxuvtuhmvvcnlw:M%40giavy2652006@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function sync() {
  console.log('Connecting to local DB...');
  const local = new Client({ connectionString: localUrl });
  await local.connect();

  console.log('Connecting to Supabase DB...');
  const remote = new Client({
    connectionString: remoteUrl,
    ssl: { rejectUnauthorized: false },
  });
  await remote.connect();

  // Order matters for Foreign Keys
  const tables = [
    'users',
    'movies',
    'screenings',
    'seats',
    'pricing',
    'coupons',
    'combos',
    'combo_reservations',
    'payments',
    'tickets',
    'order_combos',
    'reviews'
  ];

  for (const table of tables) {
    try {
      const { rows } = await local.query(`SELECT * FROM "${table}"`);
      console.log(`Found ${rows.length} rows in local table "${table}"`);
      if (rows.length === 0) continue;

      const cols = Object.keys(rows[0]);
      const colNames = cols.map(c => `"${c}"`).join(', ');

      let inserted = 0;
      for (const row of rows) {
        const values = cols.map(c => row[c]);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        const query = `
          INSERT INTO "${table}" (${colNames})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING
        `;
        try {
          await remote.query(query, values);
          inserted++;
        } catch (err) {
          console.error(`Error inserting into ${table}:`, err.message);
        }
      }
      console.log(`Synced ${inserted}/${rows.length} rows to Supabase for "${table}"`);

      // Reset auto-increment sequences if table has id column
      try {
        await remote.query(`
          SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1)) FROM "${table}";
        `);
      } catch (_) {}
    } catch (err) {
      console.log(`Table "${table}" skipped or error: ${err.message}`);
    }
  }

  await local.end();
  await remote.end();
  console.log('\n=== ALL DATA SYNCED TO SUPABASE SUCCESSFULLY! ===');
}

sync().catch(console.error);
