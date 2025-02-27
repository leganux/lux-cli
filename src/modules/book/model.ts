import mongoose, { Document, Schema } from 'mongoose';

export interface IBook extends Document {
  title: string,
  author: string,
  category: mongoose.Types.ObjectId | string,
  createdAt: Date,
  updatedAt: Date
}

const bookSchema = new Schema({
  title: {
    type: String,
    required: [true, 'title is required'],
  },
  author: {
    type: String,
    required: [true, 'author is required'],
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'category',
    required: [true, 'category is required'],
  },
}, {
  timestamps: true
});

export const BookModel = mongoose.model<IBook>('Book', bookSchema);
