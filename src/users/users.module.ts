import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersGateway } from './users.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UsersGateway],
  exports: [UsersService, TypeOrmModule.forFeature([User])]
})
export class UsersModule {}
