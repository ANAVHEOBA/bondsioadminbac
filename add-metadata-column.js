const mysql = require('mysql2/promise');

async function addMetadataColumn() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: 'tramway.proxy.rlwy.net',
      port: 18418,
      user: 'root',
      password: 'xAcfRGcygedclogQmKgQdSyDteaeRPgc',
      database: 'railway'
    });

    console.log('✅ Connected to database\n');
    
    // Check if metadata column already exists
    console.log('🔍 Checking if metadata column exists...');
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = 'railway' 
         AND TABLE_NAME = 'bonds' 
         AND COLUMN_NAME = 'metadata'`
    );
    
    if (columns.length > 0) {
      console.log('ℹ️  metadata column already exists in bonds table');
      console.log('✅ No changes needed!\n');
    } else {
      console.log('🔧 Adding metadata column to bonds table...');
      
      await connection.query(
        `ALTER TABLE bonds 
         ADD COLUMN metadata JSON NULL 
         COMMENT 'Stores additional metadata like hidden_at timestamp'`
      );
      
      console.log('✅ Successfully added metadata column to bonds table\n');
    }
    
    // Verify and show current structure
    console.log('📋 Current bonds table columns:');
    const [structure] = await connection.query('DESCRIBE bonds');
    
    console.table(structure.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your NestJS server');
    console.log('2. Test the /admin/activity/list endpoint');
    console.log('3. The 500 errors should be fixed!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
addMetadataColumn()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed');
    process.exit(1);
  });