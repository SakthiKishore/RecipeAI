import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';

export default function CameraScreen() {
  const [facing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        const resizedPhoto = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        setCapturedImages(prev => [...prev, resizedPhoto.uri]);
      }
    }
  }

  function goToPreview() {
    if (capturedImages.length > 0) {
      router.push({
        pathname: '/preview',
        params: { images: JSON.stringify(capturedImages) }
      });
    }
  }

  const renderItem = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.thumbnail} />
  );

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        ratio="16:9"
      />
      <View style={styles.thumbnailContainer}>
        <FlatList
          data={capturedImages}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          contentContainerStyle={styles.thumbnailList}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.circleButton} onPress={takePicture}>
          <Ionicons name="camera" size={30} color="white" />
        </TouchableOpacity>
        {capturedImages.length > 0 && (
          <TouchableOpacity style={styles.circleButton} onPress={goToPreview}>
            <Ionicons name="checkmark" size={30} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 20,
    width: '100%',
  },
  circleButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
  },
  thumbnailList: {
    paddingHorizontal: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});