import { getConnection } from './server/dist/config/database.js';

async function check() {
  const conn = await getConnection();
  const result = await conn.execute("SELECT search_condition_vc FROM user_constraints WHERE constraint_name = 'CK_CMP_TOM_ESTADO'");
  console.log(result.rows);
  process.exit(0);
}
check();
