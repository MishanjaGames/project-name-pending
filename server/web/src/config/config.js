// REACT_APP_API_URL is selected at Docker build time based on USE_HTTPS in .env
// No runtime URL transformation needed.
const config = {
  BASE_URL: 'http://localhost:4040/api',
  SECRET: 'Z3H@u8E#375Q[hKxAprDFGmERb05',
};

export default config;
