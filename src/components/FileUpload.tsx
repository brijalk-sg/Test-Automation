import React, { useCallback, useState } from 'react';

interface FileUploadProps {
    onFileLoaded: (content: string, fileName: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFile = useCallback(
        (file: File) => {
            if (!file.name.match(/\.(tsx|jsx|ts|js)$/)) {
                alert('Please upload a .tsx, .jsx, .ts, or .js file');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setFileName(file.name);
                onFileLoaded(content, file.name);
            };
            reader.readAsText(file);
        },
        [onFileLoaded]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    return (
        <div
            className={`file-upload ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <input
                type="file"
                accept=".tsx,.jsx,.ts,.js"
                onChange={handleInputChange}
                className="file-input"
                id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="file-upload-label">
                <span className="upload-icon">📁</span>
                {fileName ? (
                    <span className="file-name">{fileName}</span>
                ) : (
                    <>
                        <span className="upload-text">Drop component or stories file here</span>
                        <span className="upload-hint">Component (.tsx) loads into editor &bull; Stories (.stories.tsx) adds extra context</span>
                    </>
                )}
            </label>
        </div>
    );
};
