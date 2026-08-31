const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const scenes = [
  { input: 'public/videos/Scene1.mp4', outDir: 'public/frames/scene1', fps: 18, width: 1920 },
  { input: 'public/videos/Scene2.mp4', outDir: 'public/frames/scene2', fps: 18, width: 1920 },
  { input: 'public/videos/Scene3.mp4', outDir: 'public/frames/scene3', fps: 18, width: 1920 },
  { input: 'public/videos/Scene4.mp4', outDir: 'public/frames/scene4', fps: 18, width: 1920 },
];

async function processScene(scene) {
  return new Promise((resolve, reject) => {
    const fullOutDir = path.join(process.cwd(), scene.outDir);
    if (!fs.existsSync(fullOutDir)) {
      fs.mkdirSync(fullOutDir, { recursive: true });
    }

    const fullInput = path.join(process.cwd(), scene.input);
    console.log(`Extracting HD frames from ${scene.input} -> ${scene.outDir} (1080p, quality 88)...`);

    ffmpeg(fullInput)
      .outputOptions([
        `-vf fps=${scene.fps},scale=${scene.width}:-1`,
        '-q:v 88',
      ])
      .output(path.join(fullOutDir, 'frame_%03d.webp'))
      .on('end', () => {
        const files = fs.readdirSync(fullOutDir).filter(f => f.endsWith('.webp'));
        console.log(`✓ Completed ${scene.outDir}: ${files.length} HD frames generated.`);
        resolve({ scene: scene.outDir, count: files.length });
      })
      .on('error', (err) => {
        console.error(`Error processing ${scene.input}:`, err);
        reject(err);
      })
      .run();
  });
}

async function run() {
  const manifest = {};
  for (const scene of scenes) {
    const result = await processScene(scene);
    manifest[path.basename(scene.outDir)] = result.count;
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'public/frames/manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('🎉 All HD 1080p frames extracted successfully! Manifest saved to public/frames/manifest.json');
}

run().catch(console.error);
