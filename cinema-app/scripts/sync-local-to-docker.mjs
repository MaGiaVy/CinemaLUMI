import pg from 'pg';
const { Client } = pg;

const sourceUrl = 'postgresql://postgres:M%40giavy265@localhost:5432/lumi_cinema?schema=public';
const targetUrl = 'postgresql://postgres:postgrespassword@localhost:5434/lumicinema?schema=public';

async function sync() {
  console.log('Connecting to Source DB (Localhost:5432)...');
  const source = new Client({ connectionString: sourceUrl });
  await source.connect();

  console.log('Connecting to Target DB (Docker:5434)...');
  const target = new Client({ connectionString: targetUrl });
  await target.connect();

  const tables = [
    { name: 'users', idCol: 'user_id' },
    { name: 'movies', idCol: 'movie_id' },
    { name: 'screenings', idCol: 'screening_id' },
    { name: 'seats', idCol: 'seat_id' },
    { name: 'pricing', idCol: 'pricing_id' },
    { name: 'coupons', idCol: 'coupon_id' },
    { name: 'combos', idCol: 'combo_id' },
    { name: 'combo_reservations', idCol: 'id' },
    { name: 'payments', idCol: 'payment_id' },
    { name: 'tickets', idCol: 'ticket_id' },
    { name: 'order_combos', idCol: 'id' },
    { name: 'reviews', idCol: 'review_id' },
  ];

  console.log('\n--- BƯỚC 1: XÓA DỮ LIỆU CŨ TRONG DOCKER ĐỂ TRÁNH XUNG ĐỘT ---');
  for (const t of [...tables].reverse()) {
    try {
      await target.query(`TRUNCATE TABLE "${t.name}" CASCADE;`);
      console.log(`✓ Đã dọn dẹp bảng "${t.name}"`);
    } catch (err) {
      console.log(`Bỏ qua bảng "${t.name}": ${err.message}`);
    }
  }

  console.log('\n--- BƯỚC 2: SAO CHÉP TOÀN BỘ DỮ LIỆU TỪ 5432 SANG DOCKER 5434 ---');
  for (const { name: table, idCol } of tables) {
    try {
      const { rows } = await source.query(`SELECT * FROM "${table}"`);
      console.log(`Tìm thấy ${rows.length} bản ghi trong bảng "${table}" (5432)`);
      if (rows.length === 0) continue;

      const cols = Object.keys(rows[0]);
      const colNames = cols.map((c) => `"${c}"`).join(', ');

      let inserted = 0;
      for (const row of rows) {
        const values = cols.map((c) => {
          const val = row[c];
          if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
            return JSON.stringify(val);
          }
          return val;
        });
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        const query = `
          INSERT INTO "${table}" (${colNames})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING
        `;
        try {
          await target.query(query, values);
          inserted++;
        } catch (err) {
          console.error(`  Lỗi khi insert vào ${table}:`, err.message);
        }
      }
      console.log(`✓ Đã sao chép ${inserted}/${rows.length} bản ghi sang Docker cho bảng "${table}"`);

      // Cập nhật sequence
      try {
        await target.query(`
          SELECT setval(pg_get_serial_sequence('"${table}"', '${idCol}'), coalesce(max("${idCol}"), 1)) FROM "${table}";
        `);
      } catch (seqErr) {
        // Một số bảng có thể không dùng serial
      }
    } catch (err) {
      console.log(`Bảng "${table}" bỏ qua hoặc lỗi: ${err.message}`);
    }
  }

  await source.end();
  await target.end();
  console.log('\n🎉 === ĐỒNG BỘ TOÀN BỘ DỮ LIỆU SANG DOCKER THÀNH CÔNG RỰC RỠ! ===');
}

sync()
  .catch((e) => {
    console.error('Lỗi đồng bộ:', e);
    process.exit(1);
  });
