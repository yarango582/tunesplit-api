const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

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

// Ruta estática para servir archivos de audio con CORS habilitado
app.use('/audio', express.static(path.join(__dirname, '..', 'separated')));

async function executeCommand(inputFile, outputDir) {
    return new Promise((resolve, reject) => {
        const dockerCommand = `docker run -v "${path.resolve(path.dirname(inputFile))}:/input" -v "${path.resolve(outputDir)}:/output" deezer/spleeter:3.8 separate -p spleeter:5stems "/input/${path.basename(inputFile)}" -o /output`;
        exec(dockerCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return reject(error);
            }
            resolve(stdout);
        });
    });
}

app.post('/analyze', upload.single('audioFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Eliminar la extensión del nombre del archivo para usarlo como nombre de carpeta
    const timestamp = path.basename(req.file.filename, path.extname(req.file.filename));
    const outputDir = path.join('separated', timestamp); // Solo el timestamp como nombre de carpeta

    try {
        await fs.mkdir(outputDir, { recursive: true });

        // Usar Docker para ejecutar Spleeter
        await executeCommand(req.file.path, outputDir);

        // Crear URLs completas para los archivos de instrumentos separados
        const instruments = [
            { name: 'Vocals', file: `/audio/${timestamp}/vocals.wav`, volume: 100 },
            { name: 'Drums', file: `/audio/${timestamp}/drums.wav`, volume: 100 },
            { name: 'Bass', file: `/audio/${timestamp}/bass.wav`, volume: 100 },
            { name: 'Other', file: `/audio/${timestamp}/other.wav`, volume: 100 },
        ];

        res.json({ instruments });

        // Limpiar el archivo original
        await fs.unlink(req.file.path);
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Error processing file');
    }
});

// Ruta para servir archivos de audio separados
app.get('/audio/:filename/:instrument', (req, res) => {
    const { filename, instrument } = req.params;
    const filePath = path.join(__dirname, '..', 'separated', filename, filename, instrument);

    if (!res.headersSent) {
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                if (!res.headersSent) {
                    res.status(500).send('Error serving file');
                }
            }
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
