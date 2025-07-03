import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { UserRole } from '../users/entities/user.entity';

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(createCommentDto: CreateCommentDto, userId: number): Promise<Comment> {
    const post = await this.postRepository.findOne({ where: { id: createCommentDto.postId } });
    if (!post) throw new NotFoundException('Post not found');

    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      post,
      user: { id: userId } as any,
      createdAt: new Date(),
    });

    return this.commentRepository.save(comment);
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, userId: number, userRole: UserRole): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) throw new NotFoundException('Comment not found');

    if (comment.user.id !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this comment');
    }

    Object.assign(comment, updateCommentDto);
    const updatedComment = await this.commentRepository.save(comment);

  // Exclude sensitive user info
  if (updatedComment.user) {
    delete (updatedComment.user as any).password;
    delete (updatedComment.user as any).email;
  }

  return updatedComment;
  }

  async remove(id: number, userId: number, userRole: UserRole): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) throw new NotFoundException('Comment not found');

    if (comment.user.id !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.commentRepository.delete(id);
  }

  async findCommentsByPost(
  postId: number,
  page = 1,
  limit = 10,
  search?: string,
): Promise<{ data: Comment[]; total: number }> {
  const skip = (page - 1) * limit;

  const where = {
    post: { id: postId },
    ...(search ? { content: Like(`%${search}%`) } : {}),
  };

  const [data, total] = await this.commentRepository.findAndCount({
    where,
    relations: ['user'],
    order: { createdAt: 'DESC' },
    skip,
    take: limit,
  });

  // Remove email and password from authors before returning
  const sanitizedData = data.map(comment => {
    if (comment.user) {
      const { password, email, ...safeAuthor } = comment.user;
      comment.user = safeAuthor as any;
    }
    return comment;
  });

  return { data: sanitizedData, total };
}

}
