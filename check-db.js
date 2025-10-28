const mysql = require('mysql2/promise');

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: 'tramway.proxy.rlwy.net',
    port: 18418,
    user: 'root',
    password: 'xAcfRGcygedclogQmKgQdSyDteaeRPgc',
    database: 'railway'
  });

  console.log('✅ Connected to database\n');

  // Check if user_reports table exists
  console.log('📊 Checking for user_reports table...\n');
  const [tables] = await connection.execute("SHOW TABLES LIKE 'user_reports'");

  if (tables.length === 0) {
    console.log('❌ user_reports table does NOT exist');
    await connection.end();
    return;
  }

  console.log('✅ user_reports table EXISTS!\n');

  // Get table structure
  console.log('📋 Table Structure:\n');
  const [structure] = await connection.execute('DESCRIBE user_reports');
  console.table(structure);

  // Count total reports
  const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM user_reports');
  console.log(`\n📈 Total Reports: ${countResult[0].total}\n`);

  if (countResult[0].total > 0) {
    // Get sample data
    console.log('📄 Sample Reports (first 5):\n');
    const [reports] = await connection.execute(`
      SELECT
        id,
        reported_user_id,
        reporter_id,
        reason,
        status,
        description,
        created_at,
        reviewed_at,
        reviewed_by
      FROM user_reports
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.table(reports);

    // Get status breakdown
    console.log('\n📊 Reports by Status:\n');
    const [statusBreakdown] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM user_reports
      GROUP BY status
    `);
    console.table(statusBreakdown);

    // Get reason breakdown
    console.log('\n📊 Reports by Reason:\n');
    const [reasonBreakdown] = await connection.execute(`
      SELECT reason, COUNT(*) as count
      FROM user_reports
      GROUP BY reason
    `);
    console.table(reasonBreakdown);
  }

  await connection.end();
  console.log('\n✅ Database check complete!');
}

checkDatabase().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
