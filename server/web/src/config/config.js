import { toHttps } from '../utils/utils';

const config = {
  BASE_URL: toHttps(process.env.REACT_APP_API_URL || 'https://localhost:4040/api'),
  SECRET: process.env.REACT_APP_JWT_SECRET || 'Z3H@u8E#375Q[hKxAprDFGmERb05',
};

export default config;
