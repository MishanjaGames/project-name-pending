const config = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4040/api',
  SECRET: process.env.REACT_APP_JWT_SECRET || '',
};

export default config;
