import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, FlatList, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { getRecipeFromImages } from '../../utils/openai';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    console.log('Captured Images:', capturedImages);
  }, [capturedImages]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        console.log('Photo taken:', photo.uri);
        setCapturedImages(prev => [...prev, photo.uri]);
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
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.preview} />
    </View>
  );

  return (
    <View style={styles.container}>
      {showPreview ? (
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
        </ScrollView>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                <Text style={styles.text}>Flip Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={takePicture}>
                <Text style={styles.text}>Take Picture</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
          <TouchableOpacity 
            style={[styles.button, styles.doneButton]} 
            onPress={() => setShowPreview(true)}
          >
            <Text style={styles.text}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
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
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  previewContainer: {
    flex: 1,
    padding: 10,
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
  },
  doneButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
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
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: '100%', // Make sure the button spans the full width
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

