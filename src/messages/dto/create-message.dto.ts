export class CreateMessageDto {
  text: string;
  senderId: number;
  chatId: string;
  attachments?: {  id: number; data: string; fileType: string; name: string; }[];
  replyToMessageId?: string;
}
