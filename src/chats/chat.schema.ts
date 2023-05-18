import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Message } from '../messages/message.schema';

export type ChatDocument = HydratedDocument<Chat>;

@Schema()
export class Chat {
  @Prop({ required: true })
  name: string;

  @Prop({ default: null})
  avatar: string;

  @Prop({ required: true, type: [Number] })
  userIds: number[]; // user ids in mysql users table

  @Prop({ required: true })
  isPrivate: boolean;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Message', default: [] })
  messages: Message[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
