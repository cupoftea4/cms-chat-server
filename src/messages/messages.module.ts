import { forwardRef, Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/schemas/message.schema';

import { ChatsModule } from 'src/chats/chats.module';
import { UsersModule } from 'src/users/users.module';

const MessageModel = MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }])

@Module({
  imports: [
    MessageModel,
    forwardRef(() => ChatsModule),
    UsersModule
  ],
  providers: [MessagesService, MessagesGateway] ,
  exports: [MessageModel],
})

export class MessagesModule {}