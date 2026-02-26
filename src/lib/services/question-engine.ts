
import { Question } from '@/src/types/question'

// Placeholder for full simulation data
// in a real app, this might be fetched or imported from a shared json
const questionsMap: Record<string, Question> = {};

export function getQuestionById(questionId: string): Question | undefined {
  // If we have the question in our map, return it
  if (questionsMap[questionId]) {
    return questionsMap[questionId];
  }
  
  // Fallback for development/avoiding crashes
  return {
    id: questionId,
    type: 'open_text',
    text: `Question ${questionId}`,
    questionText: `Question text for ${questionId} not found locally.`,
    options: []
  } as unknown as Question;
}
