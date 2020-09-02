import express from 'express';
import 'reflect-metadata';
import { useExpressServer } from 'routing-controllers';
import bodyParser from 'body-parser';
import mongoose from 'mongoose'
import dotenv from 'dotenv';
import { Container } from 'typedi';

import { UserController } from './controllers';
import { RedisService } from './services';

dotenv.config();
const app = express();
useExpressServer(app, {
  controllers: [UserController]
});

const {
  PORT,
  MONGO_PORT,
  MONGO_USERNAME,
  MONGO_PASSWORD,
} = process.env;
const mongoURI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@localhost:${MONGO_PORT}`;

app.use(bodyParser.json());
app.listen(PORT, () => {
  console.log(`===> Server is running at http://localhost:${PORT}`);
});


mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
}).then(() => {
  console.log(`===> Connected to: ${mongoURI}`);
}).catch((err) => {
  console.error(`===> Connection Error: ${mongoURI}`);
});

Container.get(RedisService);

