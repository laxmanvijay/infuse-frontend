import { VideoFrameBuffer } from 'amazon-chime-sdk-js';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

export interface IARModel {

    modelName: string;

    loader: GLTFLoader;

    model3D: GLTF;

    modelML: any;

    loadModel(): Promise<void>;

    addToSceneInitial(scene: THREE.Scene): void;

    placeObject(buffers: VideoFrameBuffer[], renderer: THREE.Renderer, scene: THREE.Scene): Promise<void>;
}