
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const mainVideo = document.getElementById('mainVideo');
const video = document.getElementById('video');
const startBtn = document.getElementById('startgame_btn');
const eventEndVideo = new Event('ended');
const loader = document.getElementById('loader');


const videos = ["video/Nose.mp4", "video/ear.mp4", "video/eyes.mp4"];
let indexVideo = 0;
let loadVideos = 0;
const success = "video/ura.mp4";
const firstVideo = "video/Greetings.mp4";
const allVideos = [success, firstVideo, ...videos];
allVideos.forEach((video) => {
    const tempVideo = document.createElement('video');
    tempVideo.src = video;
    tempVideo.preload = "auto";
    tempVideo.hidden = true;
    tempVideo.addEventListener('loadeddata', () => {
        loadVideos++;
        console.log(loadVideos, allVideos.length)
        if (loadVideos === allVideos.length) {
            loader.style.display = 'none';
            startBtn.style.display = 'block';
        }
    })
})



window.addEventListener('orientationchange', function() {
    if (screen.width >= 800) {
        canvas.style.display = 'block';
    } else {
        canvas.style.display = 'none';
    }
});

mainVideo.addEventListener('loadeddata', () => {
    mainVideo.play();
});

startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    loader.style.display = 'block';
    setupCamera();
    
})
mainVideo.addEventListener('ended',  () => {
    mainVideo.attributes['src'].value = videos[indexVideo];
    
})


const setupCamera = () => {
    navigator.mediaDevices.getUserMedia({
        video: {width: 600, height: 400},
        audio: false
    })
    .then(stream => {
        video.srcObject = stream;
    }).catch(e => {
      console.log(e)
    })
};


let faceDetector;
let handsDetector;

video.addEventListener('loadeddata', async () => {
   
    const faceModel = faceDetection.SupportedModels.MediaPipeFaceDetector;
    const handModel = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {
        runtime: 'tfjs',
    }
    const handsConfig = {
        runtime: 'tfjs',
        modelType: 'full',  
        maxHands: 2
    }
    faceDetector = await faceDetection.createDetector(faceModel, detectorConfig);
    handsDetector = await handPoseDetection.createDetector(handModel, handsConfig);
    setInterval(detectAllPoints, 100);
    mainVideo.src = firstVideo;
})

const detectAllPoints = async () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    loader.remove();

    mainVideo.style.display = 'block';
    
    if(screen.width >= 800){
      canvas.style.display = 'block'
    }
    
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const facePredictions = await faceDetector.estimateFaces(imageData);
    const handPredictions = await handsDetector.estimateHands(imageData);
   

    let nose;
    let rightEye;
    let leftEye;
    let leftEar;
    let rightEar;
    
    if(facePredictions[0]){
        const faceBox = facePredictions[0].box;
        nose = facePredictions[0].keypoints[2];
        rightEye = facePredictions[0].keypoints[1];
        leftEye = facePredictions[0].keypoints[0];
        leftEar = facePredictions[0].keypoints[4];
        rightEar = facePredictions[0].keypoints[5];
        // drawPoint(ctx, nose, "blue", 2);
        // drawPoint(ctx, rightEye, "blue", 2);
        // drawPoint(ctx, leftEye, "blue", 2);
        // drawPoint(ctx, leftEar, "blue", 2);
        // drawPoint(ctx, rightEar, "blue", 2);
        // drawBoundingBox(ctx, faceBox, "green");
    }
    
    let currentVideo = mainVideo.attributes['src'].value;
    
    handPredictions.forEach((hand) => {
        point = hand.keypoints[8];
        // drawPoint(ctx, point, "red", 2);
        if (currentVideo != firstVideo && currentVideo != success && indexVideo == 0 && isFingerTouchingNose(nose, point)) {
            mainVideo.attributes['src'].value = success;
            indexVideo++;
        }
        
    })
    const rightHand = handPredictions.find(hand => hand.handedness === 'Right');
    const leftHand = handPredictions.find(hand => hand.handedness === 'Left');


    if (leftHand && rightHand && currentVideo != success && currentVideo != firstVideo) {

        if (indexVideo == 2 && isFingerTouchingTwoPoint(leftEye, rightEye, leftHand.keypoints[8], rightHand.keypoints[8])) {

            mainVideo.attributes['src'].value = success;
            indexVideo = 0;
        }

        if ( indexVideo == 1 && isFingerTouchingTwoPoint(leftEar, rightEar, leftHand.keypoints[8], rightHand.keypoints[8])) {

            mainVideo.attributes['src'].value = success;
            indexVideo++;
        }

    }



}
function isClapping(hand1, hand2){
    const distance = calculateDistance(hand1, hand2);
    return distance < 20;
};
function drawBoundingBox(ctx, box, color) {
    ctx.beginPath();
    ctx.lineWidth = "2";
    ctx.strokeStyle = color;
    ctx.rect(box.xMin, box.yMin, box.width, box.height);
    ctx.stroke();
}

function drawPoint(ctx, point, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(point.x, point.y, size, size);
}

const calculateDistance = (point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
};

const isFingerTouchingNose = (nose, fingertip) => {
    const distance = calculateDistance(nose, fingertip);
    return distance < 10;
};

const isFingerTouchingTwoPoint = (leftPoint, rightPoint, leftHand, rightHand) => {
    const distance1 = calculateDistance(leftPoint, leftHand);
    const distance2 = calculateDistance(rightPoint, rightHand);
    return distance1 < 10 && distance2 < 10;
}