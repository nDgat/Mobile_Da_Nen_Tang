import { randomUUID } from "node:crypto";

export interface LearningExample {
  id: string;
  message: string;
}

export function readLearningExample(
  id: string,
  uppercase: boolean,
): LearningExample {
  const message = `Bạn đang đọc tài nguyên mẫu ${id}.`;

  return {
    id,
    message: uppercase ? message.toLocaleUpperCase("vi-VN") : message,
  };
}

export function createLearningExample(message: string): LearningExample {
  return {
    id: randomUUID(),
    message: message.trim(),
  };
}
