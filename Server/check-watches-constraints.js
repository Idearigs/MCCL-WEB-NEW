const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: '31.97.116.89',
  port: 5432,
  database: 'mcculloch_db',
  username: 'mcculloch_admin',
  password: '#mcculloch_admin#20026',
  dialect: 'postgres',
  logging: false
});

async function checkConstraints() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Get table constraints
    const [constraints] = await sequelize.query(`
      SELECT
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        CASE con.contype
          WHEN 'c' THEN 'CHECK'
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 't' THEN 'TRIGGER'
          WHEN 'x' THEN 'EXCLUSION'
        END AS constraint_type_desc,
        pg_get_constraintdef(con.oid) AS constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'watches'
      ORDER BY con.contype, con.conname;
    `);

    console.log('═══════════════════════════════════════════');
    console.log('WATCHES TABLE CONSTRAINTS');
    console.log('═══════════════════════════════════════════\n');

    constraints.forEach(c => {
      console.log(`${c.constraint_name}:`);
      console.log(`  Type: ${c.constraint_type_desc}`);
      console.log(`  Definition: ${c.constraint_definition}`);
      console.log('');
    });

    // Get column information
    const [columns] = await sequelize.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'watches'
      ORDER BY ordinal_position;
    `);

    console.log('═══════════════════════════════════════════');
    console.log('WATCHES TABLE COLUMNS');
    console.log('═══════════════════════════════════════════\n');

    columns.forEach(col => {
      console.log(`${col.column_name}:`);
      console.log(`  Type: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
      console.log(`  Nullable: ${col.is_nullable}`);
      console.log(`  Default: ${col.column_default || 'none'}`);
      console.log('');
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkConstraints();
