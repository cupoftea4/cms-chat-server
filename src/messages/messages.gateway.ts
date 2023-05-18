import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { UsersService } from 'src/users/users.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Chat } from 'src/chats/chat.schema';

@WebSocketGateway()
export class MessagesGateway {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService
  ) {}
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('createMessage')
  async create(@MessageBody() createMessageDto: CreateMessageDto) {
    const { chat, dataToBroadcast, senderId } = await this.messagesService.create(createMessageDto);
    this.broadcastToChat(chat, senderId, 'message', dataToBroadcast);
    return dataToBroadcast.message;
  }

  @SubscribeMessage('updateMessage')
  async update(@MessageBody() updateMessageDto: UpdateMessageDto) {
    const { chat, message, senderId }  = await this.messagesService.update(updateMessageDto);
    this.broadcastToChat(chat, senderId, 'updatedMessage', message);
    return true;
  }

  @SubscribeMessage('removeMessage')
  async remove(@MessageBody() data: { id: string, chatId: string }) {
    const { chat, senderId, msg } = await this.messagesService.remove(data.id, data.chatId);
    this.broadcastToChat(chat, senderId, 'deletedMessage', msg);
    return true;
  }

  @SubscribeMessage('getMessages')
  findAll(@MessageBody() chatId: string) {
    return this.messagesService.findByChatId(chatId);
  }

  @SubscribeMessage('getUnreadMessages')
  findAllUnread(@ConnectedSocket() client: Socket) {
    const socketId = client.id;
    return this.messagesService.findAllUnread(socketId);
  }

  @SubscribeMessage('findOneMessage')
  findOne(@MessageBody() id: number) {
    return this.messagesService.findOne(id);
  }

  async broadcastToChat(chat: Chat, exceptId: number, event: string, data: any) {
    if (!chat) throw new Error('Invalid chat id in received message');
    const users = await this.usersService.findUsersByIds(chat.userIds);
    const sender = users.find((user) => user.id === exceptId);
    if (!sender) throw new Error('Sender is not a member of the chat');
    users.forEach(async (user) => {
      const socketId = user.socket_id;
      const targetClient = this.server.sockets.sockets.get(socketId);

      if (targetClient && user.id !== exceptId) {
        targetClient.emit(event, data);
      }
    });
    return data;
  }
}
