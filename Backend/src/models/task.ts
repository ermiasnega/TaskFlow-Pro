import { Schema, model } from 'mongoose';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';
const taskSchema = new Schema({ title: { type: String, required: true, trim: true }, description: String, status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' }, priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }, dueDate: Date, category: String, userId: { type: Schema.Types.ObjectId, required: true, index: true } }, { timestamps: true });
export const Task = model('Task', taskSchema);
