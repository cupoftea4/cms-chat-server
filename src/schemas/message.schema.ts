import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;


@Schema()
export class Message {
  @Prop()
  text: string;

  @Prop({ type: [{ id: String, url: String, type: String, name: String}], default: [] })
  attachments: {
    id: string;
    url?: string;
    type: string;
    name: string;
  }[];

  @Prop({ required: true })
  sender: number; // user id in mysql users table

  @Prop() 
  author: number; // maybe

  @Prop({ default: false}) 
  isRead: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null})
  replyTo: Message;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);