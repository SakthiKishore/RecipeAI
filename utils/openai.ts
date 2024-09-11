import * as FileSystem from 'expo-file-system';

async function imageToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}

export async function getRecipeFromImages(imageUris: string[], mealType: string, dietaryRestrictions: string): Promise<string> {
  try {
    const imageContents = await Promise.all(imageUris.map(async (uri) => ({
      type: "image_url" as const,
      image_url: {
        url: await imageToBase64(uri),
      },
    })));

    const response = await fetch('https://recipe-ai-green.vercel.app/recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageContents,
        mealType,
        dietaryRestrictions,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate recipe');
    }

    const data = await response.json();
    return data.recipe || 'No recipe generated.';
  } catch (error) {
    console.error('Error generating recipe:', error);
    return 'Failed to generate recipe. Please try again.';
  }
}