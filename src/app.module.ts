import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'amy',
      password: '1234',
      database: 'cms',
      entities: [__dirname + '/**/*.entity.{js,ts}'],
      synchronize: false,
    }),
    MongooseModule.forRoot('<mongodb-link>', { dbName: 'cms'}), 
    ChatsModule, 
    MessagesModule, UsersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
