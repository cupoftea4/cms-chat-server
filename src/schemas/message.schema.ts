import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Chat } from '../chats/chat.schema';

export type MessageDocument = HydratedDocument<Message>;

type MessageContent = {
  text: string;
  attachments: string[];
}

@Schema()
export class Message {
  @Prop({ type: { text: String, attachments: [String]}, required: true })
  content: MessageContent;

  @Prop()
  sender: number; // user id in mysql users table

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' })
  chat: Chat;

  @Prop([Number]) 
  readBy: number[]; // user ids in mysql users table

  @Prop({ required: true, default: Date.now })
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);