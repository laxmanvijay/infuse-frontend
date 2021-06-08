import { CanvasVideoFrameBuffer, VideoFrameBuffer, VideoFrameProcessor } from "amazon-chime-sdk-js";

import { Renderer2 } from "@angular/core";

require('@tensorflow/tfjs-backend-cpu');
require('@tensorflow/tfjs-backend-webgl');

import * as bodyPix from '@tensorflow-models/body-pix';


export class VideoBackgroundChangeProcessor implements VideoFrameProcessor {

    constructor(private angularRenderer: Renderer2) {}

    private targetCanvas: HTMLCanvasElement = this.angularRenderer.createElement('canvas');
    private targetCanvasCtx: CanvasRenderingContext2D = this.targetCanvas.getContext('2d');
    private canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas);

    isDimensionsSet = false;


    private model: bodyPix.BodyPix;

    async init(): Promise<void> {
        this.model = await bodyPix.load();
    }

    process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
        return new Promise((resolve) => {

            const canvas = buffers[0].asCanvasElement();
            const frameWidth = canvas.width;
            const frameHeight = canvas.height;

            if (frameWidth === 0 || frameHeight === 0) {
                resolve(buffers);
            }
            
            this.setDimension(frameWidth, frameHeight);

            this.model.segmentPerson(canvas, {
                flipHorizontal: true
            })
                .then((value) => {
                    bodyPix.drawBokehEffect(this.targetCanvas, canvas, value, 20);
                    
                    buffers[0] = this.canvasVideoFrameBuffer;
                    resolve(buffers);
                });

        });
    }

    private setDimension(frameWidth: number, frameHeight: number): void {
        if (!this.isDimensionsSet) {
            this.targetCanvas.width = frameWidth;
            this.targetCanvas.height = frameHeight;
            this.isDimensionsSet = true;
        }
    }

    destroy(): Promise<void> {
        console.log("ARStickerProcessor destroyed");
        return; 
    }
}