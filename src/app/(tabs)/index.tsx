import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, FlatList } from 'react-native';
import { GestureDetector, Gesture, Directions } from 'react-native-gesture-handler';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const cameraRef = useRef<CameraView>(null);

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
        setCapturedImages(prev => [...prev, photo.uri]);
      }
    }
  }

  const swipeGesture = Gesture.Fling()
    .direction(Directions.UP)
    .onStart(() => {
      console.log('Swipe gesture started');
    })
    .onEnd(() => {
      console.log('Swipe gesture ended');
      if (capturedImages.length > 0) {
        setShowPreview(true);
      }
    });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={swipeGesture}>
        {showPreview ? (
          <View style={styles.previewContainer}>
            <FlatList
              data={capturedImages}
              renderItem={({ item }) => <Image source={{ uri: item }} style={styles.preview} />}
              keyExtractor={(item, index) => index.toString()}
            />
            <TouchableOpacity style={styles.button} onPress={() => setShowPreview(false)}>
              <Text style={styles.text}>Back to Camera</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
        )}
      </GestureDetector>
    </View>
  );
}

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: '80%',
  },
});

