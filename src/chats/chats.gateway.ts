import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayInit, WebSocketServer } from '@nestjs/websockets';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Server, Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({ cors: '*:*' })
export class ChatsGateway implements OnGatewayInit {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService
  ) {}
  @WebSocketServer()
  server: Server;

  async afterInit(server: Server) {
    server.on('connection', async (socket: Socket) => {
      const token = socket.handshake.query.token as string;
      try {
        await this.usersService.updateSocketId(token, socket.id);
      } catch (error) {
        console.log(error);
        socket.disconnect();
      }
      console.log("Connected successfully")
      socket.emit('connected', socket.id);
    });

    server.on('disconnect', (socket: Socket) => {
      const token = socket.handshake.query.token as string;
      this.usersService.updateSocketId(token);
      console.log(socket.id + ' disconnected');
    });
  }

  @SubscribeMessage('createChat')
  async create(@MessageBody() createChatDto: CreateChatDto) {
    return await this.chatsService.create(createChatDto);
  }

  @SubscribeMessage('joinChat')
  async join(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
    return await this.chatsService.join(chatId, client.id);
  }

  @SubscribeMessage('readChat')
  async read(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
    return await this.chatsService.read(chatId, client.id, this.server);
  }

  @SubscribeMessage('getAllChats')
  findAll(@ConnectedSocket() client: Socket) {
    console.log('getAllChats');
    return this.chatsService.findAllByUser(client.id);
  }

  @SubscribeMessage('getAllChatMembers')
  findAllMembers(@MessageBody() chatId: string) {
    console.log('getAllChatsMembers');
    return this.chatsService.findAllMembers(chatId);
  }

  @SubscribeMessage('findChatsByName')
  findByName(@MessageBody() name: string) {
    return this.chatsService.findByName(name);
  }

  @SubscribeMessage('updateChat')
  update(@MessageBody() updateChatDto: UpdateChatDto) {
    return this.chatsService.update(updateChatDto.id, updateChatDto);
  }

  @SubscribeMessage('removeChat')
  remove(@MessageBody() id: number) {
    return this.chatsService.remove(id);
  }
}
