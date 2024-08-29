const cleanup = async () => {
    console.log('Cleaning up old files...');
    const uploadDir = path.join(__dirname, 'uploads');
    const separatedDir = path.join(__dirname, 'separated');

    const cleanupDirectory = async (dir) => {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            if (stats.mtime < Date.now() - 24 * 60 * 60 * 1000) {  // Más de 24 horas
                await fs.unlink(filePath);
            }
        }
    };

    await cleanupDirectory(uploadDir);
    await cleanupDirectory(separatedDir);
};

module.exports = {
    executeCleanUp: () => {
        setInterval(cleanup, 60 * 60 * 1000);
    },
};