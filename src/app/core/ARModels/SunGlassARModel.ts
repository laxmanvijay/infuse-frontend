import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { IARModel } from "./ARModel";
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { CanvasVideoFrameBuffer, VideoFrameBuffer } from "amazon-chime-sdk-js";

export class SunGlassARModel implements IARModel {

    modelName = "sunglass";

    loader = new GLTFLoader();

    model3D: GLTF;

    modelML: faceLandmarksDetection.FaceLandmarksPackage;

    async loadModel(): Promise<any> {
        return Promise.all([
            new Promise((resolve, reject) => {
                this.loader.load(`assets/models/${this.modelName}/scene.gltf`, (model) => {
                    this.model3D = model;
                    resolve(null);
                });
            }),
            new Promise((resolve) => {
                faceLandmarksDetection.load(
                    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh) 
                    .then((data) => {
                        this.modelML = data;
                        resolve(null);
                    });
            })
        ]);

    }

    addToSceneInitial(scene: THREE.Scene): void {
        scene.add(this.model3D.scene);
    }

    placeObject(buffers: VideoFrameBuffer[], renderer: THREE.Renderer, scene: THREE.Scene): Promise<void> {

        return new Promise((resolve) => {
            this.modelML.estimateFaces({
                input: <HTMLCanvasElement>buffers[0].asCanvasElement(),
                flipHorizontal: false,
                returnTensors: false
            }).then((predictions) => {
                
                const prediction: any = predictions[0];
                    
                this.model3D.scene.position.x = prediction.annotations.midwayBetweenEyes[ 0 ][ 0 ];
                this.model3D.scene.position.y = -prediction.annotations.midwayBetweenEyes[ 0 ][ 1 ];
                this.model3D.scene.position.z = -prediction.annotations.midwayBetweenEyes[ 0 ][ 2 ] - 20;

                this.model3D.scene.up.x = prediction.annotations.midwayBetweenEyes[ 0 ][ 0 ] - prediction.annotations.noseBottom[ 0 ][ 0 ];
                this.model3D.scene.up.y = -( prediction.annotations.midwayBetweenEyes[ 0 ][ 1 ] - prediction.annotations.noseBottom[ 0 ][ 1 ] );
                this.model3D.scene.up.z = prediction.annotations.midwayBetweenEyes[ 0 ][ 2 ] - prediction.annotations.noseBottom[ 0 ][ 2 ];
                const length = Math.sqrt( this.model3D.scene.up.x ** 2 + this.model3D.scene.up.y ** 2 + this.model3D.scene.up.z ** 2 );
                this.model3D.scene.up.x /= length;
                this.model3D.scene.up.y /= length;
                this.model3D.scene.up.z /= length;

                const eyeDist = Math.sqrt(
                    ( prediction.annotations.leftEyeUpper1[ 3 ][ 0 ] - prediction.annotations.rightEyeUpper1[ 3 ][ 0 ] ) ** 2 +
                        ( prediction.annotations.leftEyeUpper1[ 3 ][ 1 ] - prediction.annotations.rightEyeUpper1[ 3 ][ 1 ] ) ** 2 +
                        ( prediction.annotations.leftEyeUpper1[ 3 ][ 2 ] - prediction.annotations.rightEyeUpper1[ 3 ][ 2 ] ) ** 2
                );
                this.model3D.scene.scale.x = eyeDist / 6;
                this.model3D.scene.scale.y = eyeDist / 6;
                this.model3D.scene.scale.z = eyeDist / 6;
    
                this.model3D.scene.rotation.y = Math.PI;
                this.model3D.scene.rotation.z = Math.PI / 2 - Math.acos( this.model3D.scene.up.x );
                
                resolve(null);
            }).catch((err) => {
                console.log(err);
                resolve(null);
            });
        });
    }

}