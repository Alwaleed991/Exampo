const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is stored securely
});


async function generateQuiz(subject, numQuestions) {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant that creates quizzes in JSON format. Each quiz should have:
        - A title (short and descriptive of the subject).
        - A category (choose one of these: General, Science, Education, History, Geography, Literature, Movies & TV Shows, Music, Sports, Technology). 
        If the subject does not fit any category, use "General".
        - The quiz should include a list of questions with:
          - Question text
          - Four multiple-choice options (labeled A, B, C, D)
          - The correct answer.
          
        Format the response as JSON:
        {
          "title": "Quiz Title",
          "category": "Category",
          "quiz": [
            {
              "question": "Question text",
              "options": { "A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4" },
              "correctAnswer": "A"
            },
            ...
          ]
        }`,
      },
      {
        role: 'user',
        content: `Create a quiz on the subject "${subject}" with ${numQuestions} questions. The category should be one of the predefined categories or "General" if the subject doesn't fit.`,
      },
    ];
    

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Specify the model you're using
      messages: messages,
      temperature: 0.7, // Adjust for creativity
    });

    let quiz = response.choices[0].message.content
    quiz = quiz.replace(/```json|```/g, '').trim();
    quiz = JSON.parse(quiz);

    return quiz;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate quiz.');
  }
}

module.exports = generateQuiz;
