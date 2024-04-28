// src/server.js
import app from './app';
import { PORT } from './config/app.config';

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
