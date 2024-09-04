import OpenAI from "openai";
import * as FileSystem from 'expo-file-system';

const OPENAI_API_KEY = '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'; // Replace with your actual API key

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Add this line if you're running in a browser environment
});

async function imageToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}

export async function getRecipeFromImages(imageUris: string[]): Promise<string> {
  try {
    const imageContents = await Promise.all(imageUris.map(async (uri) => ({
      type: "image_url" as const,
      image_url: {
        url: await imageToBase64(uri),
      },
    })));

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Give me a recipe based on the items you find in the image(s)" },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content || 'No recipe generated.';
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return 'Failed to generate recipe. Please try again.';
  }
}