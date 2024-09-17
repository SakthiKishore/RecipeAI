import React, { useState } from 'react';
import { View, Image, TextInput, TouchableOpacity, Text, StyleSheet, FlatList, Modal, SafeAreaView, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const imageSize = width / 3 - 20; // Smaller image size

export default function PreviewScreen() {
  const { images } = useLocalSearchParams();
  const [mealType, setMealType] = useState('Breakfast');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const imageUris = JSON.parse(images as string);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  async function generateRecipe() {
    router.push({
      pathname: '/recipe',
      params: { 
        images: images as string, 
        mealType, 
        dietaryRestrictions 
      }
    });
  }

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity onPress={() => setFullScreenImage(item)}>
      <Image source={{ uri: item }} style={styles.preview} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={imageUris}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3}
        style={styles.imageList}
      />
      <Picker
        selectedValue={mealType}
        onValueChange={(itemValue) => setMealType(itemValue)}
        style={styles.picker}
      >
        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((option) => (
          <Picker.Item key={option} label={option} value={option} />
        ))}
      </Picker>
      <TextInput
        style={styles.input}
        value={dietaryRestrictions}
        onChangeText={setDietaryRestrictions}
        placeholder="Enter any dietary restrictions..."
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={generateRecipe}>
        <Text style={styles.buttonText}>Let's Cook!</Text>
      </TouchableOpacity>

      <Modal visible={!!fullScreenImage} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setFullScreenImage(null)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  imageList: {
    marginBottom: 20,
  },
  preview: {
    width: imageSize,
    height: imageSize,
    margin: 5,
    borderRadius: 5,
  },
  picker: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
});