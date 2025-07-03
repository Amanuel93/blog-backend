import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Post } from './entities/post.entity';
import { UserRole } from '../users/entities/user.entity';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto, userId: number, imagePath: string): Promise<Post> {
    const post = this.postRepository.create({
      ...createPostDto,
      author: { id: userId } as any,
      image: imagePath,
      publishedDate: new Date(),
    });
    return this.postRepository.save(post);
  }

// async findAll(page = 1, limit = 10, search?: string): Promise<{ data: Post[]; total: number }> {
//   const skip = (page - 1) * limit;
//   const where = search ? { title: Like(`%${search}%`) } : {};

//   const [data, total] = await this.postRepository.findAndCount({
//     where,
//     skip,
//     take: limit,
//     relations: ['author', 'comments'],
//     order: { publishedDate: 'DESC' },
//   });

//   // Remove email and password from authors before returning
//   const sanitizedData = data.map(post => {
//     if (post.author) {
//       const { password, email, ...safeAuthor } = post.author;
//       post.author = safeAuthor as any;
//     }
//     return post;
//   });

//   return { data: sanitizedData, total };
// }

async findAll(
  page = 1,
  limit = 10,
  search?: string,
): Promise<{ data: Post[]; total: number }> {
  const skip = (page - 1) * limit;

  const queryBuilder = this.postRepository
    .createQueryBuilder('post')
    .leftJoinAndSelect('post.author', 'author')
    .leftJoinAndSelect('post.comments', 'comments')
    .orderBy('post.publishedDate', 'DESC')
    .skip(skip)
    .take(limit);

//   if (search) {
//     queryBuilder.andWhere(
//       '(post.title LIKE :search OR author.name LIKE :search)',
//       { search: `%${search}%` },
//     );
//   }
if (search && search.trim() !== '') {
  queryBuilder.where('post.title LIKE :search', { search: `%${search}%` })
              .orWhere('author.name LIKE :search', { search: `%${search}%` });
}

  const [data, total] = await queryBuilder.getManyAndCount();

  const sanitizedData = data.map(post => {
    if (post.author) {
      const { password, email, ...safeAuthor } = post.author;
      post.author = safeAuthor as any;
    }
    return post;
  });

  return { data: sanitizedData, total };
}

  async findOne(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'comments', 'comments.user'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author) {
      const { password, email, ...safeAuthor } = post.author;
      post.author = safeAuthor as any;
    }

    return post;
  }

async update(
  id: number,
  updatePostDto: UpdatePostDto,
  userId: number,
  userRole: UserRole,
  imagePath: string | null
): Promise<Post> {
  const post = await this.findOne(id);

  if (post.author.id !== userId && userRole !== UserRole.ADMIN) {
    throw new ForbiddenException('You do not have permission to update this post');
  }

  Object.assign(post, updatePostDto);

  if (imagePath) {
    post.image = imagePath;
  }

  return this.postRepository.save(post);
}

  async remove(id: number, userId: number, userRole: UserRole): Promise<{ message: string }> {
  const post = await this.findOne(id);

  if (post.author.id !== userId && userRole !== UserRole.ADMIN) {
    throw new ForbiddenException('You do not have permission to delete this post');
  }

  const result = await this.postRepository.delete(id);

  if (result.affected === 0) {
    throw new NotFoundException(`Post with ID ${id} not found or already deleted.`);
  }

  return { message: `Post has been successfully deleted.` };
}

}
