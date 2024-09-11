import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This will be securely stored on the server
});

export async function POST(request: Request) {
  try {
    const { imageContents, mealType, dietaryRestrictions } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `You are a seasoned chef with over 20 years of experience. Give me a ${mealType} recipe based on the items you find in the image(s). The recipe should be time tested, delicious, and easy to make and quick to prepare. ${dietaryRestrictions ? `Please consider the following dietary restrictions: ${dietaryRestrictions}.` : ''}` },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 300,
    });

    return Response.json({ recipe: response.choices[0].message.content || 'No recipe generated.' });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return Response.json({ error: 'Failed to generate recipe. Please try again.' }, { status: 500 });
  }
}