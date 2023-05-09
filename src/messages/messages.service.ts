import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from 'src/schemas/chat.schema';
import { Message, MessageDocument } from 'src/schemas/message.schema';
import { User } from 'src/users/entities/user.entity';
import { In, Repository } from 'typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private MessageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private ChatModel: Model<ChatDocument>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async findAllUnread(socketId: string) {
    const user = await this.usersRepository.findOne({ where: { socket_id: socketId }});
    const chats = await this.ChatModel.find({ userIds: user?.id }).populate({
      path: 'messages',
      match: { isRead: false, sender: { $ne: user?.id } },
      select: '_id text attachments timestamp',
    });
  
    const unreadMessages = chats.flatMap((chat) =>
      chat.messages.map((message) => ({
        id: (message as any)._id.toString(),
        preview: message.text || (message.attachments && message.attachments[0]?.name || ''),
        timestamp: message.timestamp,
        chatName: chat.name,
        chatId: chat._id.toString(),
      }))
    );
  
    return unreadMessages;
  }


  async findByChatId(chatId: string) {
    const chat = await this.ChatModel.findById(chatId).populate({
      path: 'messages',
      options: { sort: { timestamp: -1 }, limit: 50 },
      populate: {
        path: 'replyTo',
        select: '_id text attachments',
      },
    });
  
    if (!chat) return null;
  
    const userIds = new Set(chat.messages.map((message) => message.sender));
  
    const users = await this.usersRepository.findBy({ id: In([...userIds]) });
  
    const messages = chat.messages.map((message) => {
      const user = users.find((user) => user.id === message.sender);
      if (!user) return null;
  
      const replyTo = message.replyTo
        ? {
            id: (message.replyTo as any)._id.toString(),
            preview: message.replyTo.text || (message.replyTo.attachments[0]?.name || ''),
          }
        : null;
  
      return {
        id: (message as any)._id!.toString(),
        text: message.text,
        attachments: message.attachments,
        timestamp: message.timestamp,
        replyTo,
        sender: {
          id: user.id,
          name: user.name,
          avatar: user?.avatar,
        },
      };
    });
  
    return messages.filter(Boolean);
  }
  
  async create(createMessageDto: CreateMessageDto, server: any) {
    const { text, senderId, chatId, replyToMessageId } = createMessageDto;

    const message = new this.MessageModel({
      text,
      sender: senderId,
      replyTo: replyToMessageId, 
      timestamp: new Date(),
    });

    const savedMessage = await (await message.save()).populate('replyTo');

    const chat = await this.ChatModel.findByIdAndUpdate(
      chatId,
      { $push: { messages: savedMessage._id } },
      { new: true }
    );
    
    if (!chat) throw new Error('Invalid chat id in received message');

    const users = await this.usersRepository.findBy({ id: In(chat.userIds) });
    const sender = users.find((user) => user.id === senderId);
    if (!sender) throw new Error('Sender is not a member of the chat');
    users.forEach(async (user) => {
      const socketId = user.socket_id;
        const targetClient = server.sockets.sockets.get(socketId);

      if (targetClient && user.id !== senderId ) {
        const replyTo = message.replyTo
        ? {
            id: (message.replyTo as any)._id.toString(),
            preview: message.replyTo.text || (message.replyTo.attachments[0]?.name || ''),
          }
        : null;
        targetClient.emit('message', {message: {
          id: (message as any)._id!.toString(),
          text: message.text,
          attachments: message.attachments,
          timestamp: message.timestamp,
          replyTo,
          sender: {
            id: sender.id,
            name: sender.name,
            avatar: sender?.avatar,
          },
        }, chatId});
      }
    });

    return savedMessage;
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }
}
