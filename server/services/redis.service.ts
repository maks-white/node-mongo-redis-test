import * as asyncRedis from 'async-redis';
import { Service } from 'typedi';
import dotenv from 'dotenv';


dotenv.config();
const {
  REDIS_PASSWORD,
  REDIS_PORT,
} = process.env;

@Service()
export class RedisService {
  private redisClient: any;

  constructor() {
    this.redisClient = asyncRedis.createClient({
      port: Number(REDIS_PORT),
      password: REDIS_PASSWORD,
    });
    this.redisClient.on('connect', () => { console.error(`===> Connected to Redis at ${REDIS_PORT} port`); });
    this.redisClient.on('error', (error: any) => { console.error(error); });
  }

  public async get(key: string): Promise<string> {
    return await this.redisClient.get(key);;
  }

  public async set(key: string, value: string): Promise<string> {
    return await this.redisClient.set(key, value);
  }
}
