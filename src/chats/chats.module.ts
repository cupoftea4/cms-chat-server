import { forwardRef, Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSchema } from 'src/schemas/chat.schema';
import { MessagesModule } from 'src/messages/messages.module';
import { UsersModule } from 'src/users/users.module';

const ChatModel = MongooseModule.forFeature([{ name: 'Chat', schema: ChatSchema }])

@Module({
  imports: [ChatModel, forwardRef(() => MessagesModule), UsersModule],
  providers: [ChatsGateway, ChatsService],
  exports: [ChatModel]
})
export class ChatsModule {}
