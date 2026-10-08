import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Notion PDF Converter Server listening on port ${PORT}`);
  console.log(`🌐 API Endpoint: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});
