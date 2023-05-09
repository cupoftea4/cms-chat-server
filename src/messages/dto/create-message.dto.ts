export class CreateMessageDto {
  text: string;
  senderId: number;
  chatId: string;
  replyToMessageId?: string;
}
