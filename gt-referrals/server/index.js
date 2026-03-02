import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import mongoose from 'mongoose';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Backend Running'));

const PORT = process.env.PORT || 5000; //TODO: Define what port app will run on

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.listen(PORT, () => console.log(`Server on port ${PORT}`));