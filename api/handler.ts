import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Near the top of your file, add this line to check if the API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in the environment variables');
  throw new Error('OpenAI API key is missing');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageUris, mealType, dietaryRestrictions } = req.body;

  try {
    console.log('Received request:', { mealType, dietaryRestrictions, imageCount: imageUris.length });

    const imageContents = await Promise.all(
      imageUris.map(async (uri: string) => {
        try {
          // Your image processing logic here
          return {
            type: 'image_url',
            image_url: { url: uri },
          };
        } catch (error) {
          console.error('Error processing image:', error);
          throw error;
        }
      })
    );

    console.log('Processed images, calling OpenAI API');

    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a seasoned chef with over 20 years of experience. Give me a ${mealType} recipe based on the items you find in the image(s). The recipe should be time tested, delicious, and easy to make and quick to prepare. ${
                  dietaryRestrictions ? `Please consider the following dietary restrictions: ${dietaryRestrictions}.` : ''
                }`
              },
              ...imageContents
            ],
          },
        ],
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Received response from OpenAI');

    return res.status(200).json(openaiResponse.data);
  } catch (error) {
    console.error('Error in API handler:', error);
    let errorMessage = 'Unknown error occurred';

    if (axios.isAxiosError(error) && error.response) {
      errorMessage = `OpenAI API error: ${error.response.status} ${error.response.statusText}`;
      console.error('OpenAI API response:', JSON.stringify(error.response.data, null, 2));
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('Detailed error:', errorMessage);

    return res.status(500).json({
      error: 'Failed to generate recipe. Please try again.',
      details: errorMessage
    });
  }
}