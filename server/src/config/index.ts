import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

export interface OracleDbConfig {
  user: string;
  password: string;
  connectString: string;
  poolMin: number;
  poolMax: number;
  poolIncrement: number;
  poolTimeout: number;
  poolAlias: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  oracle: OracleDbConfig;
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  oracle: {
    user: process.env.DB_USER || process.env.NODE_ORACLEDB_USER || '',
    password: process.env.DB_PASSWORD || process.env.NODE_ORACLEDB_PASSWORD || '',
    connectString: process.env.DB_CONNECTION_STRING || process.env.NODE_ORACLEDB_CONNECTIONSTRING || '',
    poolMin: Number(process.env.DB_POOL_MIN) || 2,
    poolMax: Number(process.env.DB_POOL_MAX) || 10,
    poolIncrement: Number(process.env.DB_POOL_INCREMENT) || 1,
    poolTimeout: Number(process.env.DB_POOL_TIMEOUT) || 60,
    poolAlias: process.env.DB_POOL_ALIAS || 'ERP_COMPRAS_POOL',
  },
};
