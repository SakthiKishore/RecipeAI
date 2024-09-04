import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, FlatList, Dimensions, ScrollView, ActivityIndicator, Modal, SafeAreaView, Platform } from 'react-native';
import { getRecipeFromImages } from '../../utils/openai';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
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
          { compress: 0.01, format: ImageManipulator.SaveFormat.JPEG }
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
      const generatedRecipe = await getRecipeFromImages(capturedImages);
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
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <FlatList
              data={capturedImages}
              renderItem={renderItem}
              keyExtractor={(item, index) => index.toString()}
              numColumns={2}
              scrollEnabled={false}
            />
            {recipe && (
              <View style={styles.recipeContainer}>
                <Text style={styles.recipeText}>{recipe}</Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={generateRecipe} 
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                {isLoading ? 'Generating...' : 'Generate Recipe'}
              </Text>
            </TouchableOpacity>
            {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                setShowPreview(false);
                setRecipe(null);
              }}
            >
              <Text style={styles.actionButtonText}>Back to Camera</Text>
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.actionButton} onPress={takePicture}>
              <Text style={styles.actionButtonText}>Take Picture</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => setShowPreview(true)}
            >
              <Text style={styles.actionButtonText}>Done</Text>
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
            <Text style={styles.backButtonText}>
              {Platform.OS === 'ios' ? '◀ Back' : 'Back'}
            </Text>
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
    justifyContent: 'center',
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
  imageContainer: {
    margin: 5,
  },
  preview: {
    width: imageSize,
    height: imageSize,
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
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    width: 150,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
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
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
    marginTop: 20,
  },
  recipeContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
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
  backButtonText: {
    color: 'white',
    fontSize: 18,
  },
});

