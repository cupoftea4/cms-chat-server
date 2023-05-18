import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from 'src/chats/chat.schema';
import { ChatsService } from 'src/chats/chats.service';
import { Message, MessageDocument } from 'src/messages/message.schema';
import { FileService } from 'src/services/file';
import { UsersService } from 'src/users/users.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private MessageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private ChatModel: Model<ChatDocument>,
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService,
    private readonly fileService: FileService
  ) {}

  async findAllUnread(socketId: string) {
    const user = await this.usersService.findOneBySocketId(socketId);
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
    const users = await this.usersService.findUsersByIds(Array.from(userIds));
  
    const messages = chat.messages.map((message) => {
      const user = users.find((user) => user.id === message.sender);
      if (!user) return null;
  
      const replyTo = createReplyTo(message);
  
      return {
        id: (message as any)._id!.toString(),
        isRead: message.isRead,
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
  
  async create(createMessageDto: CreateMessageDto) {
    const { text, senderId, chatId, replyToMessageId, attachments } = createMessageDto;

    const file = attachments && attachments[0];
    if (file) await this.fileService.saveFile(file.data, "./files/" + file.name)

    const message = new this.MessageModel({
      text,
      sender: senderId,
      attachments: file ? [{path: "files/" + file.name, fileType: file.fileType, name: file.name}] : [],
      replyTo: replyToMessageId, 
      timestamp: new Date(),
    });

    const savedMessage = await message.save().then(m => m.populate('replyTo'));
    const chat = await this.chatsService.saveMessage(chatId, savedMessage._id);
    const sender = await this.usersService.findOne(senderId); 
    const replyTo = createReplyTo(savedMessage);

    if (!chat) throw new Error('Invalid chat id in received message');
    if (!sender) throw new Error('Sender does not exist');
    
    const dataToBroadcast = {
      message: {
        id: (message as any)._id.toString(),
        text: message.text,
        attachments: message.attachments,
        timestamp: message.timestamp,
        replyTo,
        sender: {
          id: sender.id,
          name: sender.name,
          avatar: sender?.avatar,
        },
      }, 
      chatId
    };

    return { chat, dataToBroadcast, senderId } as const;
  }

  async update(updateMessageDto: UpdateMessageDto) {
    const message = await this.MessageModel.findById(updateMessageDto.id);
    if (!message) throw new Error('Message does not exist');
    message.text = updateMessageDto.text;
    message.save();
    const chat = await this.ChatModel.findById(updateMessageDto.chatId);
    if (!chat) throw new Error('Invalid chat id in received message');
    return { message, senderId: message.sender, chat } as const;
  }

  async remove(id: string, chatId: string) {
    const message = await this.MessageModel.findById(id);
    const senderId = message?.sender;
    const chat = await this.ChatModel.findByIdAndUpdate(
      { _id: chatId },
      { $pull: { messages: id } }
    );

    if (!chat) throw new Error('Invalid chat id in received message');
    if (!senderId) throw new Error('Sender does not exist');

    const msg = await this.MessageModel.findByIdAndDelete(id);
    return { chat, senderId, msg } as const;
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }
}


function createReplyTo(message: Message) {
  return message.replyTo
    ? {
        id: (message.replyTo as any)._id.toString(),
        preview: message.replyTo.text || (message.replyTo.attachments[0]?.name || ''),
      }
    : null;
}