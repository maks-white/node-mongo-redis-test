import * as mongoose from 'mongoose';
import { Document, Schema, Types } from 'mongoose';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, Length } from 'class-validator';


@JSONSchema({ description: 'User Schema'})
export class User {
  @Length(24, 24)
  @IsString()
  public _id?: Types.ObjectId;

  @IsString()
  public fullName: string;

  @IsString()
  public dateOfBirth: string;

  @IsString()
  public gender: string;
}

const schema = new Schema({
  _id: Types.ObjectId,
  fullName: String,
  dateOfBirth: String,
  gender: String,
}, {
  timestamps: true,
  collection: 'users',
});

type UserDoc = Document & User;
export const UserSchema = mongoose.model<UserDoc>('User', schema);
