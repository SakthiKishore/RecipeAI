import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import LottieView from 'lottie-react-native';
import { useLocalSearchParams } from 'expo-router';
import { getRecipeFromImages } from '../utils/openai';

export default function RecipeResult() {
  const { images, mealType, dietaryRestrictions } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipe() {
      try {
        const imageUris = JSON.parse(images as string);
        const generatedRecipe = await getRecipeFromImages(imageUris, mealType as string, dietaryRestrictions as string);
        setRecipe(generatedRecipe);
      } catch (error) {
        console.error('Error generating recipe:', error);
        setRecipe('Failed to generate recipe. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecipe();
  }, [images, mealType, dietaryRestrictions]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/animations/cooking-animation.json')}
            autoPlay
            loop
            style={styles.animation}
          />
          <Text style={styles.loadingText}>Cooking up your recipe...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.recipeContainer}>
          <Text style={styles.recipeText}>{recipe}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    fontSize: 18,
    marginTop: 20,
  },
  recipeContainer: {
    padding: 20,
  },
  recipeText: {
    fontSize: 16,
    lineHeight: 24,
  },
});