import { BorderStyle } from 'docx';

import { GenerateDocxLocale } from '@/api/document/dto/generate-docx.dto';
import type { LocaleDictionary } from '@/common/types/document.type';

export const MARKITDOWN_TIMEOUT_MS = 15_000;

export const DOCX_BORDER_NONE = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' as const },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' as const },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' as const },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' as const },
};

export const LOCALE_DICTIONARY: Record<GenerateDocxLocale, LocaleDictionary> = {
  [GenerateDocxLocale.VI]: {
    answerLabel: 'Đáp án',
    answersLabel: 'Các đáp án',
    defaultTitle: 'Bài kiểm tra',
    detailedSolutionLabel: 'Lời giải chi tiết',
    falseLabel: 'Sai',
    gradeLabel: 'Khối',
    lessonLabel: 'Bài',
    metadataTitle: 'Thông tin',
    questionPrefix: 'Câu',
    solutionsTitle: 'ĐÁP ÁN VÀ LỜI GIẢI CHI TIẾT',
    textbookLabel: 'Sách giáo khoa',
    trueLabel: 'Đúng',
    typeLabel: 'Dạng',
    unitLabel: 'Chương',
  },
  [GenerateDocxLocale.EN]: {
    answerLabel: 'Answer',
    answersLabel: 'Answers',
    defaultTitle: 'Test',
    detailedSolutionLabel: 'Detailed solution',
    falseLabel: 'False',
    gradeLabel: 'Grade',
    lessonLabel: 'Lesson',
    metadataTitle: 'Metadata',
    questionPrefix: 'Question',
    solutionsTitle: 'ANSWERS AND DETAILED SOLUTIONS',
    textbookLabel: 'Textbook',
    trueLabel: 'True',
    typeLabel: 'Type',
    unitLabel: 'Unit',
  },
};
