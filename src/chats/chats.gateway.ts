import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayInit } from '@nestjs/websockets';
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
      server.emit('connected', socket.id);
      console.log('user ' + token + ' connected by ' + socket.id);
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

  @SubscribeMessage('getAllChats')
  findAll(@ConnectedSocket() client: Socket) {
    console.log('getAllChats');
    return this.chatsService.findAllByUser(client.id);
  }

  @SubscribeMessage('findOneChat')
  findOne(@MessageBody() id: number) {
    return this.chatsService.findOne(id);
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
