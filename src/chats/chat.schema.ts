import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatDocument = HydratedDocument<Chat>;

@Schema()
export class Chat {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: [Number] } )
  users: number[]; // user ids in mysql users table
}

export const ChatSchema = SchemaFactory.createForClass(Chat);