import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;


@Schema()
export class Message {
  @Prop()
  text: string;

  @Prop({ type: [{ path: String, fileType: String, name: String}], default: [] })
  attachments: {
    path: string;
    fileType: string;
    name: string;
  }[];

  @Prop({ required: true })
  sender: number; // user id in mysql users table

  @Prop() 
  author: number;

  @Prop({ default: false}) 
  isRead: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null})
  replyTo: Message;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);