import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, FlatList, Dimensions, ScrollView, ActivityIndicator, Modal, SafeAreaView } from 'react-native';
import { getRecipeFromImages } from '../../utils/openai';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons'; 
import { Picker } from '@react-native-picker/picker';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [mealType, setMealType] = useState('Breakfast');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    console.log('Captured Images:', capturedImages);
  }, [capturedImages]);

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
    <View style={styles.container}>
      {showPreview ? (
        <View style={styles.previewContainer}>
          <ScrollView style={styles.scrollView}>
            <FlatList
              data={capturedImages}
              renderItem={renderItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageList}
            />
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Meal Type:</Text>
              <Picker
                selectedValue={mealType}
                onValueChange={(itemValue) => setMealType(itemValue)}
                style={styles.picker}
              >
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>

              <Text style={styles.inputLabel}>Dietary Restrictions or Allergies:</Text>
              <TextInput
                style={styles.textInput}
                value={dietaryRestrictions}
                onChangeText={setDietaryRestrictions}
                placeholder="Enter any dietary restrictions..."
              />
            </View>

            {recipe && (
              <View style={styles.recipeContainer}>
                <Text style={styles.recipeText}>{recipe}</Text>
              </View>
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
              <Ionicons name="camera" size={30} color="white" />
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
        </View>
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
        <SafeAreaView style={styles.fullScreenContainer}>
          {fullScreenImage && (
            <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} />
          )}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setFullScreenImage(null)}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </View>
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
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 100, // Add padding to ensure content is not hidden behind buttons
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
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100, // Add extra padding at the bottom for buttons
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
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
    fontSize: 30, // Keep the larger font size
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
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  picker: {
    marginBottom: 20,
  },
});

