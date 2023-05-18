import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Server } from 'socket.io';
import { Chat, ChatDocument } from 'src/chats/chat.schema';
import { Message, MessageDocument } from 'src/messages/message.schema';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { In, ObjectId, Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';


@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

 
  async findAllByUser(socketId: string): Promise<any[]> {
    const user = await this.usersRepository.findOne({ where: { socket_id: socketId }});
    const chats = await this.chatModel
      .aggregate()
      .match({ userIds: { $elemMatch: { $eq: user?.id } }}) 
      .lookup({
        from: 'messages',
        localField: 'messages',
        foreignField: '_id',
        as: 'messages',
      })
      .unwind({
        path: '$messages',
        preserveNullAndEmptyArrays: true,
      })
      .sort({ 'messages.timestamp': -1 })
      .group({
        _id: '$_id',
        id: { $first: '$_id' },
        name: { $first: '$name' },
        avatar: { $first: '$avatar' },
        userIds: { $first: '$userIds' },
        isPrivate: { $first: '$isPrivate' },
        lastMessage: {
          $first: {
            $cond: {
              if: { $not: { $eq: [ { $objectToArray: '$messages' } , null] } }, // Check if there are messages
              then: {
                id: '$messages._id',
                text: '$messages.text',
                attachments: '$messages.attachments',
                timestamp: '$messages.timestamp',
              },
              else: null, // Return null if there are no messages
            }
          },
        },
      })
      .exec();
    return chats;
  }

  async findAllMembers(chatId: string) {
    const chat = await this.chatModel.findById(chatId).select('userIds');
    if (!chat) throw new Error('Chat not found');
    const users = await this.usersService.findUsersByIds(chat.userIds);
    return users.map(user => ({ id: user.id, name: user.name, avatar: user.avatar }));
  }

  findByName(name: string | null) {
    if (!name) name = '';
    const chats = this.chatModel.aggregate()
      .match({ name: { $regex: name, $options: 'i' }, isPrivate: false })
      .project({
        id: { $toString: '$_id' },
        name: 1,
        avatar: 1,
        _id: 0
      })
      .limit(5)
      .exec();
    return chats;
  }
  
   async create(createChatDto: CreateChatDto) {
    const chat = new this.chatModel(createChatDto);
    const savedChat = await chat.save();
    const foundChat = await this.findOne(savedChat._id);
    return foundChat;
   }

  async join(chatId: string, socketId: string) {
    const user = await this.usersRepository.findOne({ where: { socket_id: socketId }});
    const chat = await this.chatModel.findById(chatId);

    if (!chat || !user) return null;
    if (chat.isPrivate || chat.userIds.includes(user?.id)) return null;
    chat.userIds.push(user?.id);
    await chat.save();
    const foundChat = await this.findOne(chat._id);
    return foundChat;
  }

  async read(chatId: string, socketId: string, server: Server) {
    const user = await this.usersRepository.findOne({ where: { socket_id: socketId }});
    const chat = await this.chatModel.findById(chatId);
    const messages = await this.messageModel.find({ _id: { $in: chat?.messages }});
    if (!chat || !user) return null;
    messages.forEach((message) => {
      if (message.sender !== user?.id) message.isRead = true;
      message.save();
    });

    const users = await this.usersRepository.findBy({ id: In(chat.userIds) });
    const sender = users.find((user) => user.id === user.id);
    if (!sender) throw new Error('Sender is not a member of the chat');
    users.forEach(async (user) => {
      const socketId = user.socket_id;
      const targetClient = server.sockets.sockets.get(socketId);

      if (targetClient && user.id !== sender.id) {
        targetClient.emit('read', chatId);
      }
    });
    return true;
  }

  async findOne(id: ObjectId) {
    const chat = await this.chatModel
      .aggregate()
      .match({ _id: id })
      .limit(1)
      .lookup({
        from: 'messages',
        localField: 'messages',
        foreignField: '_id',
        as: 'messages',
      })
      .unwind({
        path: '$messages',
        preserveNullAndEmptyArrays: true,
      })
      .sort({ 'messages.timestamp': -1 })
      .group({
        _id: '$_id',
        id: { $first: '$_id' },
        name: { $first: '$name' },
        avatar: { $first: '$avatar' },
        userIds: { $first: '$userIds' },
        lastMessage: {
          $first: {
            $cond: {
              if: { $not: { $eq: [ { $objectToArray: '$messages' } , null] } }, // Check if there are messages
              then: {
                id: '$messages._id',
                text: '$messages.text',
                attachments: '$messages.attachments',
                timestamp: '$messages.timestamp',
              },
              else: null, // Return null if there are no messages
            }
          },
        },
      })
      .exec();
    return chat[0];
  }

  saveMessage(chatId: string, messageId: ObjectId) {
    return this.chatModel.findByIdAndUpdate(chatId,
      { $push: { messages: messageId } },
      { new: true }
    );
  }

  update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
