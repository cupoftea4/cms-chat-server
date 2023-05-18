import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class FileService {
  async uploadFileFromBuffer(fileBuffer: Buffer, filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.writeFile(filePath, fileBuffer, { encoding: 'binary' }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(filePath);
        }
      });
    });
  }

  async saveFile(fileData: string, filePath: string): Promise<void> {
    try {
      const base64Data = fileData.replace(/^data:\w+\/\w+;base64,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');
      await fs.promises.writeFile(filePath, fileBuffer);
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('File saving failed');
    }
  }
}