const bcrypt = require('bcrypt');

async function generateHash() {
  const hash = await bcrypt.hash('Admin@123', 10);
  console.log('Hash for Admin@123:', hash);
  
  // Also test the validation
  const isValid = await bcrypt.compare('Admin@123', hash);
  console.log('Validation test:', isValid);
}

generateHash();
