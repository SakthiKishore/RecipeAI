import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, FlatList, Dimensions, ScrollView, ActivityIndicator, Modal, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { getRecipeFromImages } from '../../utils/openai';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons'; 
import { Picker } from '@react-native-picker/picker';
import { Keyboard } from 'react-native';
import { useColorScheme } from '@/src/components/useColorScheme';
import { Text as ThemedText, View as ThemedView } from '@/src/components/Themed';
import Colors from '@/src/constants/Colors';

export default function App() {
  const [facing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [mealType, setMealType] = useState('Breakfast');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme();

  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    console.log('Captured Images:', capturedImages);
  }, [capturedImages]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.ß
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        const originalFileInfo = await FileSystem.getInfoAsync(photo.uri);
        console.log(`Original photo dimensions: ${photo.width} x ${photo.height}`);
        console.log(`Original photo size: ${originalFileInfo.exists ? originalFileInfo.size : 'unknown'} bytes`);

        const resizedPhoto = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.0, format: ImageManipulator.SaveFormat.JPEG }
        );

        console.log(`Resized photo URL: ${resizedPhoto.uri}`);
        console.log(`Resized photo dimensions: ${resizedPhoto.width} x ${resizedPhoto.height}`);

        const resizedFileInfo = await FileSystem.getInfoAsync(resizedPhoto.uri);
        console.log(`Resized photo size: ${resizedFileInfo.exists ? resizedFileInfo.size : 'unknown'} bytes`);

        setCapturedImages(prev => [...prev, resizedPhoto.uri]);
      }
    }
  }

  async function generateRecipe() {
    setIsLoading(true);
    try {
      const generatedRecipe = await getRecipeFromImages(capturedImages, mealType, dietaryRestrictions);
      setRecipe(generatedRecipe);
    } catch (error) {
      console.error('Error generating recipe:', error);
      setRecipe('Failed to generate recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.imageContainer} 
      onPress={() => setFullScreenImage(item)}
    >
      <Image source={{ uri: item }} style={styles.preview} />
    </TouchableOpacity>
  );

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const aspectRatio = 1769 / 1024;
  const cameraHeight = screenWidth * aspectRatio;

  return (
    <ThemedView style={styles.container}>
      {showPreview ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.previewContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollViewContent,
              keyboardVisible && { paddingBottom: 300 } // Adjust this value as needed
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.imageListContainer}>
              <FlatList
                data={capturedImages}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageList}
              />
            </View>
            
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Meal Type:</ThemedText>
              <Picker
                selectedValue={mealType}
                onValueChange={(itemValue) => setMealType(itemValue)}
                style={[styles.picker, { color: Colors[colorScheme ?? 'light'].text }]}
              >
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((option) => (
                  <Picker.Item 
                    key={option} 
                    label={option} 
                    value={option} 
                    color={Colors[colorScheme ?? 'light'].text}
                  />
                ))}
              </Picker>

              <ThemedText style={styles.inputLabel}>Dietary Restrictions or Allergies:</ThemedText>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    color: Colors[colorScheme ?? 'light'].text, 
                    borderColor: Colors[colorScheme ?? 'light'].border 
                  }
                ]}
                value={dietaryRestrictions}
                onChangeText={setDietaryRestrictions}
                placeholder="Enter any dietary restrictions..."
                placeholderTextColor={Colors[colorScheme ?? 'light'].text}
                multiline={true}
              />
            </ThemedView>

            {recipe && (
              <ThemedView style={styles.recipeContainer}>
                <ThemedText style={styles.recipeText}>{recipe}</ThemedText>
              </ThemedView>
            )}
          </ScrollView>
          
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity 
              style={styles.circleButton} 
              onPress={() => {
                setShowPreview(false);
                setRecipe(null);
              }}
            >
              <Ionicons name="arrow-back" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.circleButton, styles.cookButton]} 
              onPress={generateRecipe} 
              disabled={isLoading}
            >
              <Text style={styles.cookButtonText}>
                {isLoading ? 'Cooking...' : "Let's\ncook"}
              </Text>
            </TouchableOpacity>
            {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={[styles.camera, { height: cameraHeight }]}
            facing={facing}
            ratio="16:9"
          >
            {/* Remove the buttonContainer and its contents */}
          </CameraView>
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity style={styles.circleButton} onPress={takePicture}>
              <Ionicons name="camera" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.circleButton} 
              onPress={() => setShowPreview(true)}
            >
              <Ionicons name="checkmark" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <Modal visible={!!fullScreenImage} animationType="slide">
        <SafeAreaView style={[styles.fullScreenContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          {fullScreenImage && (
            <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} />
          )}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setFullScreenImage(null)}
          >
            <ThemedText style={styles.backButtonText}>←</ThemedText>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </ThemedView>
  );
}

const { width } = Dimensions.get('window');
const imageSize = width / 2 - 15;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    width: '100%',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10, // Add space between buttons
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  previewContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 150, // Increased padding to account for buttons
  },
  imageListContainer: {
    height: 170, // Adjust this value based on your image size
    marginBottom: 20,
  },
  imageList: {
    paddingHorizontal: 10,
  },
  imageContainer: {
    marginHorizontal: 5,
  },
  preview: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  cameraContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(128, 128, 128, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cookButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(128, 128, 128, 0.8)', // More visible greyish color
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 30,
  },
  recipeContainer: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  recipeText: {
    fontSize: 16,
    color: 'black',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullScreenImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  inputContainer: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  picker: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
});
