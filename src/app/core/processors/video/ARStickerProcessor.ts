import { CanvasVideoFrameBuffer, VideoFrameBuffer, VideoFrameProcessor } from "amazon-chime-sdk-js";

import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

import * as THREE from 'three';
import { IARModel } from "../../ARModels/ARModel";
import { Renderer2 } from "@angular/core";

require('@tensorflow/tfjs-backend-cpu');
require('@tensorflow/tfjs-backend-webgl');

export class ARStickerProcessor implements VideoFrameProcessor {

    constructor(private stickerModel: IARModel, private angularRenderer: Renderer2) {}

    private targetCanvas: HTMLCanvasElement = this.angularRenderer.createElement('canvas');
    private targetCanvasCtx: CanvasRenderingContext2D = this.targetCanvas.getContext('2d');
    private canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas);

    private webglCanvas: HTMLCanvasElement = this.angularRenderer.createElement('canvas');

    private counter = 0;
    private isDimensionsSet = false;

    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;

    public model: faceLandmarksDetection.FaceLandmarksPackage;

    init(): void {

        this.webglCanvas.width = 900;
        this.webglCanvas.height = 540;
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.webglCanvas,
            alpha: true,
        });
        this.renderer.setSize(900, 540);
        
        this.camera = new THREE.PerspectiveCamera( 45, 1, 0.1, 2000 );
        this.camera.position.x = 900 / 2;
        this.camera.position.y = -540 / 2;
        this.camera.position.z = -( 540 / 2 ) / Math.tan( 45 / 2 );
        this.camera.lookAt( new THREE.Vector3(900 / 2, -540 / 2, 0) );

        this.scene = new THREE.Scene();
        this.scene.add( new THREE.AmbientLight( 0xcccccc ) );
        this.camera.add( new THREE.PointLight( 0xffffff, 0.8 ) );
        this.scene.add( this.camera );
        
        this.renderer.render(this.scene, this.camera);

        this.stickerModel.addToSceneInitial(this.scene);

    }

    process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
        return new Promise((resolve) => {

            this.counter++;

            if (this.counter % 20 !== 0) {
                resolve(buffers);
            }

            const canvas = buffers[0].asCanvasElement();
            const frameWidth = canvas.width;
            const frameHeight = canvas.height;

            if (frameWidth === 0 || frameHeight === 0) {
                resolve(buffers);
            }

            this.setDimension(frameWidth, frameHeight);
            this.targetCanvasCtx.drawImage(canvas, 0, 0);

            this.stickerModel.placeObject(buffers,this.renderer,this.scene);

            this.renderer.render(this.scene, this.camera);
            this.targetCanvasCtx.drawImage(this.renderer.domElement, 0, 0);
            buffers[0] = this.canvasVideoFrameBuffer;
            resolve(buffers);

        });
    }

    private setDimension(frameWidth: number, frameHeight: number): void {
        if (!this.isDimensionsSet) {
            this.targetCanvas.width = frameWidth;
            this.targetCanvas.height = frameHeight;
            this.webglCanvas.width = frameWidth;
            this.webglCanvas.height = frameHeight;
            this.isDimensionsSet = true;
        }
    }

    destroy(): Promise<void> {
        console.log("ARStickerProcessor destroyed");
        return; 
    }
}