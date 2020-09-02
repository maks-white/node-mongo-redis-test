import { Response } from 'express';
import { Types } from 'mongoose';
import {
  JsonController, Get, Post, Put, Delete, Param, BodyParam, Res,
} from 'routing-controllers';
import { User, UserSchema } from '../models';
import { BadRequestError, InternalServerError, NotFoundError } from '../services';
import { Container } from 'typedi';
import { RedisService } from '../services';


@JsonController('/api/v1/users')
export class UserController {
  private redisService = Container.get(RedisService);
  private usersKey = 'users';
  private fullOfUsers = 'fullOfUsers';

  constructor() { }

  /**
   * Gets all users
   * @param response - express response
   */
  @Get('')
  public async getAll(@Res() response: Response): Promise<Response> {
    let result = await this.getUsersFromRedis();
    if (result) return response.status(200).json(result);
    result = await UserSchema.find({}, (err: any, res: User[]) => {
      if (err) throw new InternalServerError();
      this.setAllUsers(res);
      return res;
    });
    return response.status(200).json(result);
  }

  /**
   * Gets User by ID
   * @param id - user ID
   * @param response - express response
   */
  @Get('/:id')
  public async get(@Param('id') id: string, @Res() response: Response): Promise<Response> {
    if (!id) throw new BadRequestError('User ID should be provided');

    let result: User = await this.getUsersFromRedis(id);
    if (result) return response.status(200).send(result);

    result = await UserSchema.findById(Types.ObjectId(id), (err: any, res: User) => {
      if (err) throw new InternalServerError();
      this.setUserToRedis(res);
      return res;
    });
    return response.status(200).send(result);
  }

  /**
   * Creates new user
   * @param name - user name
   * @param birthDate - birth date of user
   * @param gender - gender of user
   * @param response - express response
   */
  @Post('')
  public async createUser(
    @BodyParam('name') name: string,
    @BodyParam('birthDate') birthDate: string,
    @BodyParam('gender') gender: string,
    @Res() response: Response,
  ): Promise<Response> {
    if (!name || !birthDate || !gender) throw new BadRequestError('Please provide all User params in body');
    const user: User = {
      fullName: name,
      dateOfBirth: birthDate,
      gender: gender
    };
    const result = await UserSchema.create(user);
    if (!result) throw new InternalServerError();
    await this.redisService.set(this.fullOfUsers, '');
    return response.status(200).json(result);
  }

  /**
   * Updates existing user
   * @param id - user ID
   * @param name - user name
   * @param birthDate - birth date of user
   * @param gender - gender of user
   * @param response - express response
   */
  @Put('/:id')
  public async update(
    @Param('id') id: string,
    @BodyParam('name') name: string,
    @BodyParam('birthDate') birthDate: string,
    @BodyParam('gender') gender: string,
    @Res() response: Response,
  ): Promise<Response> {
    if (!id) throw new BadRequestError('User ID should be provided');
    if (!name || !birthDate || !gender) throw new BadRequestError('Please provide all User params in body');
    const updated: User = {
      fullName: name,
      dateOfBirth: birthDate,
      gender: gender,
    };
    const result = await UserSchema.updateOne({ _id: Types.ObjectId(id) }, updated);
    if (result.nModified === 0) throw new NotFoundError("User does not exist");
    if (result.ok !== 1) throw new InternalServerError();
    await this.redisService.set(this.fullOfUsers, '');
    return response.status(200).json(result);
  }

  /**
   * Deletes existing user
   * @param id - user ID
   * @param response - express response
   */
  @Delete('/:id')
  public async delete(@Param('id') id: string, @Res() response: Response): Promise<Response> {
    if (!id) throw new BadRequestError('User ID should be provided');
    const result = await UserSchema.remove({ _id: Types.ObjectId(id) });
    if (result.deletedCount === 0) throw new NotFoundError("User does not exist");
    if (result.ok !== 1) throw new InternalServerError();
    this.deleteUserInRedis(id);
    return response.status(200).json(result);
  }

  /**
   * Gets user or users from redis if exists
   * @param id - user id
   */
  private async getUsersFromRedis(): Promise<User[]>;
  private async getUsersFromRedis(id: string): Promise<User>;
  private async getUsersFromRedis(id?: string): Promise<User | User[]> {
    const response = await this.redisService.get(this.usersKey);
    if (!response) return;
    if (!id && Boolean(this.redisService.get(this.fullOfUsers))) return JSON.parse(response);

    let result: User;
    JSON.parse(response).forEach((user: User) => {
      if (user && String(user && user._id) === id) {
        result = user;
        return;
      }
    });
    return result;
  }

  /**
   * Saves User to redis
   * @param user - user
   */
  private async setUserToRedis(user: User): Promise<string> {
    const userString = JSON.stringify(user);
    const response: string = await this.redisService.get(this.usersKey);
    let parsedResp: string = response;

    if (parsedResp) {
      if (parsedResp[0] === '[') parsedResp = parsedResp.slice(1);
      if (parsedResp[parsedResp.length - 1] === ']') parsedResp = parsedResp.slice(0, parsedResp.length - 1);
    }

    let existsInRedis: boolean = false;
    JSON.parse(`[${parsedResp}]`).forEach((item: User) => {
      if (item && item._id === user._id) existsInRedis = true;
    });

    let newValue: string = (existsInRedis) ? `[${parsedResp}]` : `[${parsedResp},${userString}]`;
    await this.redisService.set(this.fullOfUsers, '');
    return await this.redisService.set(this.usersKey, newValue);
  }

  /**
   * Saves all list of users to Redis
   * @param users
   */
  private async setAllUsers(users: User[]): Promise<string> {
    const res = await this.redisService.set(this.usersKey, JSON.stringify(users));
    if (res === 'OK') this.redisService.set(this.fullOfUsers, 'ok');
    return res;
  }

  /**
   * Deletes user from redis
   * @param id
   */
  private async deleteUserInRedis(id: string): Promise<string> {
    const response = await this.redisService.get(this.usersKey);
    if (!response) return;

    let result = [] as User[];
    JSON.parse(response).forEach((user: User) => {
      if (user) {
        if (String(user && user._id) === id) return;
        result.push(user);
      }
    });

    return this.redisService.set(this.usersKey, JSON.stringify(result));
  }
}
