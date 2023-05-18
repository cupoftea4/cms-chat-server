import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import * as fs from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('files/:fileName')
  downloadFile(@Param('fileName') fileName: string, @Res() res: Response) {
    const filePath = `files/${fileName}`;

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline`); //`attachment; filename="${fileName}"`
      if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      }
    
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.status(404).send('File not found');
    }
  }

}
