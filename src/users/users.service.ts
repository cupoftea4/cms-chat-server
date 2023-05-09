import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import axios from 'axios';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async updateSocketId(token: string, socketId?: string) {
    const user = await axios.get('http://127.0.0.1:8000/auth/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept": "application/json"
      },
    }).then(res => res.data)
    .catch(err => console.log(err));
    return this.usersRepository.update(user.id, { socket_id: socketId });
  }

}
