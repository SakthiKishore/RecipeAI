import * as FileSystem from 'expo-file-system';

async function imageToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}

export async function getRecipeFromImages(imageUris: string[], mealType: string, dietaryRestrictions: string): Promise<string> {
  try {
    const response = await fetch('https://recipeaibackend-iri2c66zd-sakthikishores-projects.vercel.app/api/handler', {
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

    const responseText = await response.text();
    console.log('Raw server response:', responseText);

    if (!response.ok) {
      console.error('Server responded with an error:', response.status, responseText);
      return `Server error: ${response.status}. Response: ${responseText}`;
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      return `Failed to parse server response. Raw response: ${responseText}`;
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Unexpected response structure:', data);
      return `Unexpected response structure. Response: ${JSON.stringify(data)}`;
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling backend:', error);
    return `Failed to generate recipe. Error: ${(error as Error).message}`;
  }
}