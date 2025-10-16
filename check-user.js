const mysql = require('mysql2/promise');

async function checkUser() {
  const connection = await mysql.createConnection({
    host: 'tramway.proxy.rlwy.net',
    port: 18418,
    user: 'root',
    password: 'xAcfRGcygedclogQmKgQdSyDteaeRPgc',
    database: 'railway'
  });

  try {
    // Check reporter user data
    const [userRows] = await connection.execute(
      'SELECT id, full_name, user_name, email, profile_image, country_id, phone, dob, bio, created_at FROM users WHERE id = ?',
      ['9fa6e3b0-504a-48ab-9642-0b742055bdb3']
    );
    
    console.log('\n=== REPORTER USER DATA ===');
    console.log(JSON.stringify(userRows, null, 2));
    
    // Check if country exists
    if (userRows[0] && userRows[0].country_id) {
      const [countryRows] = await connection.execute(
        'SELECT id, name FROM countries WHERE id = ?',
        [userRows[0].country_id]
      );
      console.log('\n=== COUNTRY DATA ===');
      console.log(JSON.stringify(countryRows, null, 2));
    }
    
    // Check report data
    const [reportRows] = await connection.execute(
      'SELECT * FROM bond_reports WHERE reporter_id = ?',
      ['9fa6e3b0-504a-48ab-9642-0b742055bdb3']
    );
    
    console.log('\n=== REPORT DATA ===');
    console.log(JSON.stringify(reportRows, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkUser();
