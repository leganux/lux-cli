import { Request, Response } from 'express';
import { BookModel, IBook } from './model';

interface ApiError {
  message: string,
  [key: string]: any
}

export class BookController {
  // Add custom controller methods here
}
