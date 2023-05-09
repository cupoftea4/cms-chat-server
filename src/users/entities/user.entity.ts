import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users'})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  password: string;
  
  @Column()
  email: string;
  
  @Column({ nullable: true})
  avatar: string;
  
  @Column({ nullable: true })
  socket_id: string;
}