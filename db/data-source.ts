import { DataSourceOptions, DataSource } from 'typeorm';
const dev = false;
export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: dev
    ? 'localhost'
    : 'brtzudg8yfixwo1kmee0-mysql.services.clever-cloud.com',
  port: 3306,
  username: dev ? 'root' : 'uy3tjedf7fsdcssc',
  password: dev ? '15092001' : 't7khjsfkB5Hi2m2sgvuh',
  database: dev ? 'milktea-nestjs' : 'brtzudg8yfixwo1kmee0',
  entities: ['**/*.entity.js'],
  migrations: ['dist/db/migrations/*.js'],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
