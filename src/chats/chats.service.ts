import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from 'src/schemas/chat.schema';
import { Message, MessageDocument } from 'src/schemas/message.schema';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';


@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,

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
  
   async create(createChatDto: CreateChatDto) {
    const chat = new this.chatModel(createChatDto);

    const message1 = new this.messageModel({ text: "test", sender: 1 });
    const message2 = new this.messageModel({ text: "test1", sender: 2 });

    const savedMessage1 = await message1.save();
    const savedMessage2 = await message2.save();

    chat.messages.push(savedMessage1, savedMessage2);

    const savedChat = await chat.save();

    return savedChat;
  }



  findOne(id: number) {
    return `This action returns a #${id} chat`;
  }

  update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
