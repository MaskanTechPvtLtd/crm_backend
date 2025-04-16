import * as faceapi from 'face-api.js';
import * as canvas from 'canvas';

faceapi.env.monkeyPatch({
  Canvas: canvas.Canvas,
  Image: canvas.Image,
  ImageData: canvas.ImageData,
});

export { faceapi, canvas };
// console.log('Current working directory:', process.cwd());
export async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./model');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./model');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./model');
}
