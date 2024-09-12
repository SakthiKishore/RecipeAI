import * as FileSystem from 'expo-file-system';

async function imageToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}

export async function getRecipeFromImages(imageUris: string[], mealType: string, dietaryRestrictions: string): Promise<string> {
  try {
    const response = await fetch('https://recipeaibackend-7j98vimqc-sakthikishores-projects.vercel.app/api/handler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUris: await Promise.all(imageUris.map(async (uri) => await imageToBase64(uri))),
        mealType,
        dietaryRestrictions,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Server responded with an error:', response.status, text);
      return `Server error: ${response.status}. Please try again.`;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Unexpected content type:', contentType, text);
      return 'Unexpected response from server. Please try again.';
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No recipe generated.';
  } catch (error) {
    console.error('Error calling backend:', error);
    return 'Failed to generate recipe. Please try again.';
  }
}