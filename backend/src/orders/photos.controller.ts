import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { PhotosService } from './photos.service';

@Controller('orders/:orderId/photos')
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Get()
  list(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.photos.list(orderId);
  }

  // Unggah satu foto (multipart: file + kind + caption). Maksimal 3 MB.
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 3 * 1024 * 1024, files: 1 } }),
  )
  upload(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadPhotoDto,
  ) {
    return this.photos.upload(orderId, file, dto);
  }

  // Lihat foto (inline), atau unduh dengan ?download=1
  @Get(':photoId/file')
  async file(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { mime, downloadName, stream } = await this.photos.open(orderId, photoId);
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `${download === '1' ? 'attachment' : 'inline'}; filename="${downloadName}"`,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(stream);
  }

  @Delete(':photoId')
  remove(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.photos.remove(orderId, photoId);
  }
}