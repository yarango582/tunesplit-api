const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const execPromise = util.promisify(exec);

const app = express();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const extension = path.extname(file.originalname) || '.mp3';
        cb(null, `${timestamp}${extension}`);
    }
});

const upload = multer({ storage: storage });

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use('/audio', express.static(path.join(__dirname, '..', 'separated')));


async function runExtendedDiagnostics() {
    console.log('Running extended diagnostics...');
    try {
        const { stdout: pythonVersion } = await exec('python3 --version');
        console.log('Python version:', pythonVersion.trim());

        const { stdout: spleeterVersion } = await exec('spleeter --version');
        console.log('Spleeter version:', spleeterVersion.trim());

        const { stdout: ffmpegVersion } = await exec('ffmpeg -version');
        console.log('FFmpeg version:', ffmpegVersion.split('\n')[0]);

        const { stdout: diskSpace } = await exec('df -h');
        console.log('Disk space:\n', diskSpace);

        const { stdout: memInfo } = await exec('free -m');
        console.log('Memory info:\n', memInfo);

        const { stdout: envVars } = await exec('env');
        console.log('Environment variables:\n', envVars);

        const { stdout: dirStructure } = await exec('ls -R /usr/app');
        console.log('Directory structure:\n', dirStructure);

        console.log('Extended diagnostics completed.');
    } catch (error) {
        console.error('Error running extended diagnostics:', error);
    }
}

async function runSpleeterStepByStep(inputFile, outputDir) {
    console.log('Running Spleeter step by step...');

    try {
        // Step 1: Check if the model is already downloaded
        const modelPath = '/root/.cache/spleeter/models/5stems';
        const modelExists = await fs.access(modelPath).then(() => true).catch(() => false);

        if (!modelExists) {
            console.log('Model not found. Downloading...');
            await execPromise('spleeter separate -p spleeter:5stems -o /tmp /dev/null');
            console.log('Model downloaded successfully.');
        } else {
            console.log('Model already exists.');
        }

        // Step 2: Run Spleeter separation
        console.log('Starting Spleeter separation...');
        const { stdout, stderr } = await execPromise(`spleeter separate -p spleeter:5stems -o "${outputDir}" "${inputFile}"`);

        console.log('Spleeter stdout:', stdout);
        console.log('Spleeter stderr:', stderr);

        // Step 3: Check output
        const expectedSubDir = path.basename(inputFile, path.extname(inputFile));
        const subDirPath = path.join(outputDir, expectedSubDir);

        if (fsSync.existsSync(subDirPath)) {
            const subDirContents = fsSync.readdirSync(subDirPath);
            console.log(`Contents of ${subDirPath}:`, subDirContents);

            const expectedFiles = ['vocals.wav', 'drums.wav', 'bass.wav', 'piano.wav', 'other.wav'];
            const allFilesExist = expectedFiles.every(file =>
                fsSync.existsSync(path.join(subDirPath, file))
            );

            if (allFilesExist) {
                console.log('All expected output files were created successfully');
                return true;
            } else {
                console.error('Not all expected files were created');
                return false;
            }
        } else {
            console.error(`Expected subdirectory ${expectedSubDir} not found in ${outputDir}`);
            return false;
        }
    } catch (error) {
        console.error('Error running Spleeter:', error);
        return false;
    }
}

async function separateAudio(inputFile, outputDir) {
    console.log(`Starting Spleeter process for file: ${inputFile}`);
    console.log(`Output directory: ${outputDir}`);

    const success = await runSpleeterStepByStep(inputFile, outputDir);

    if (!success) {
        throw new Error('Spleeter separation failed');
    }
}

app.post('/analyze', upload.single('audioFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const timestamp = path.basename(req.file.filename, path.extname(req.file.filename));
    const outputDir = path.join('separated', timestamp);

    try {
        console.log(`Creating output directory: ${outputDir}`);
        await fs.mkdir(outputDir, { recursive: true });

        console.log(`Starting audio separation for file: ${req.file.path}`);
        await separateAudio(req.file.path, outputDir);

        console.log('Audio separation completed successfully');

        const instruments = [
            { name: 'Vocals', file: `/audio/${timestamp}/${timestamp}/vocals.wav`, volume: 100 },
            { name: 'Drums', file: `/audio/${timestamp}/${timestamp}/drums.wav`, volume: 100 },
            { name: 'Bass', file: `/audio/${timestamp}/${timestamp}/bass.wav`, volume: 100 },
            { name: 'Piano', file: `/audio/${timestamp}/${timestamp}/piano.wav`, volume: 100 },
            { name: 'Other', file: `/audio/${timestamp}/${timestamp}/other.wav`, volume: 100 },
        ];

        res.json({ instruments });

        console.log(`Deleting input file: ${req.file.path}`);
        await fs.unlink(req.file.path);
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send(`Error processing file: ${error.message}`);
    }
});

app.post('/analyze', upload.single('audioFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const timestamp = path.basename(req.file.filename, path.extname(req.file.filename));
    const outputDir = path.join('separated', timestamp);

    try {
        console.log(`Creating output directory: ${outputDir}`);
        await fs.mkdir(outputDir, { recursive: true });

        console.log(`Starting audio separation for file: ${req.file.path}`);
        await separateAudio(req.file.path, outputDir);

        console.log('Audio separation completed successfully');

        const instruments = [
            { name: 'Vocals', file: `/audio/${timestamp}/${timestamp}/vocals.wav`, volume: 100 },
            { name: 'Drums', file: `/audio/${timestamp}/${timestamp}/drums.wav`, volume: 100 },
            { name: 'Bass', file: `/audio/${timestamp}/${timestamp}/bass.wav`, volume: 100 },
            { name: 'Piano', file: `/audio/${timestamp}/${timestamp}/piano.wav`, volume: 100 },
            { name: 'Other', file: `/audio/${timestamp}/${timestamp}/other.wav`, volume: 100 },
        ];

        res.json({ instruments });

        console.log(`Deleting input file: ${req.file.path}`);
        await fs.unlink(req.file.path);
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send(`Error processing file: ${error.message}`);
    }
});

app.get('/audio/:timestamp/:filename/:instrument', (req, res) => {
    const { timestamp, filename, instrument } = req.params;
    const filePath = path.join(__dirname, '..', 'separated', timestamp, filename, `${instrument}.wav`);

    console.log(`Attempting to send file: ${filePath}`);

    if (!res.headersSent) {
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                if (!res.headersSent) {
                    res.status(500).send('Error serving file');
                }
            } else {
                console.log(`File sent successfully: ${filePath}`);
            }
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // await runExtendedDiagnostics();
});