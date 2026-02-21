// Maximum file size in bytes (1MB)
const MAX_FILE_SIZE = 1024 * 1024;

// Maximum number of pixels (based on Groq's limit)
const MAX_PIXELS = 33000000; // Just under Groq's 33177600 pixel limit

export const compressImage = (
    file: File, 
    setIsCompressing: (compressing: boolean) => void,
    setCompressionInfo: (info: string | null) => void,
): Promise<File> => {
    return new Promise((resolve, reject) => {
        setIsCompressing(true);
        setCompressionInfo(null);

        // If file is under the size limit, we still need to check pixel count
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image(); 
            img.src = event.target?.result as string;

            img.onload = () => {
                const initialPixelCount = img.width * img.height;
                const needsCompression = file.size > MAX_FILE_SIZE || initialPixelCount > MAX_PIXELS;

                if (!needsCompression) {
                    setIsCompressing(false);
                    resolve(file);
                    return;
                }

                const originalWidth = img.width;
                const originalHeight = img.height;
                const originalPixels = originalWidth * originalHeight;

                const sizeScaleFactor = MAX_FILE_SIZE / file.size;
                let quality = Math.min(0.8, Math.max(0.5, sizeScaleFactor * 0.9));

                // Calculate dimensions based on pixel count if needed
                let width = img.width;
                let height = img.height;

                if (initialPixelCount > MAX_PIXELS) {
                    // Scale down to respect pixel limit while preserving aspect ratio
                    const pixelRatio = Math.sqrt(MAX_PIXELS / initialPixelCount);
                    width = Math.floor(width * pixelRatio);
                    height = Math.floor(height * pixelRatio);

                    if (file.size > MAX_FILE_SIZE * 2) {
                        quality = Math.max(0.5, quality * 0.9);
                    }
                }
                // If only file size is the issue and not pixel count
                else if (file.size > MAX_FILE_SIZE * 3) {
                    // Reduce dimensions for very large files to help with compression
                    const resizeFactor = Math.sqrt(MAX_FILE_SIZE / file.size) * 0.9;
                    width = Math.floor(img.width * resizeFactor);
                    height = Math.floor(img.height * resizeFactor);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Convert to blob with compression
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            setIsCompressing(false);
                            reject(new Error('Canvas to Blob conversion failed'));
                            return;
                        }

                        // Create a new file from the blob
                        const compressedFile = new File(
                            [blob],
                            file.name,
                            { type: 'image/jpeg', lastModified: Date.now() }
                        );

                        // Create compression info for display
                        const sizeBefore = (file.size / 1024).toFixed(1);
                        const sizeAfter = (compressedFile.size / 1024).toFixed(1);
                        const pixelsBefore = originalPixels.toLocaleString();
                        const pixelsAfter = (width * height).toLocaleString();

                        const compressionInfo =
                            `Original: ${sizeBefore}KB (${pixelsBefore} px) → Compressed: ${sizeAfter}KB (${pixelsAfter} px)`;

                        console.log(compressionInfo);
                        setCompressionInfo(compressionInfo);
                        setIsCompressing(false);
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                setIsCompressing(false);
                reject(new Error('Failed to load image'));
            };
        };

        reader.onerror = () => {
            setIsCompressing(false);
            reject(new Error('Failed to read file'));
        };
    });
};

