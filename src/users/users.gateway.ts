import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayInit } from '@nestjs/websockets';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway()
export class UsersGateway{
  constructor(
    private readonly usersService: UsersService
  ) {}

  @SubscribeMessage('findUsersByName')
  findByName(@MessageBody() name: string | null) {
    return this.usersService.findByName(name);
  }

}
