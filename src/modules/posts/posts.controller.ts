import { Express } from 'express';

import {
  Controller,
  Get,
  Post as HttpPost,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { extname } from 'path';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

@HttpPost()
@Roles('author', 'admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(
  FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }),
)
async create(
  @Body() createPostDto: CreatePostDto,
  @Req() req,
  @UploadedFile() image: Express.Multer.File,
) {
  const imagePath: string | null = image?.path ?? null;
  return this.postsService.create(createPostDto, req.user.id, imagePath);
}


  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.postsService.findAll(page, limit, search);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

@Patch(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('author', 'admin')
@UseInterceptors(
  FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }),
)
async update(
  @Param('id', ParseIntPipe) id: number,
  @Body() updatePostDto: UpdatePostDto,
  @Req() req,
  @UploadedFile() image: Express.Multer.File,
) {
  const imagePath: string | null = image?.path ?? null;
  return this.postsService.update(id, updatePostDto, req.user.id, req.user.role, imagePath);
}


  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('author', 'admin')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.postsService.remove(id, req.user.id, req.user.role);
  }
}
