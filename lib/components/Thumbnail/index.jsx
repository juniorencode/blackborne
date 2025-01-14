import PropTypes from 'prop-types';
import { useState, useRef, useEffect } from 'react';
import { BsFiletypeMp3 } from 'react-icons/bs';
import { FaCircleNotch } from 'react-icons/fa';

export const Thumbnail = props => {
  const { className, file, url, input } = props;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [thumbnail, setThumbnail] = useState(null);

  useEffect(() => {
    const captureThumbnail = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setThumbnail(canvas.toDataURL('image/jpeg'));
      }
    };
    const handleLoadedData = () => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = 2;
      }
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('seeked', captureThumbnail);
    }

    return () => {
      if (video) {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('seeked', captureThumbnail);
      }
    };
  }, []);

  const format = () => {
    if (file && file.type) {
      const mimeType = file.type;
      if (mimeType.startsWith('image/')) {
        return 'image';
      } else if (mimeType.startsWith('video/')) {
        return 'video';
      } else if (mimeType.startsWith('audio/')) {
        return 'audio';
      } else {
        return 'unknown';
      }
    }
  };

  return (
    <div className={`${className} flex items-center flex-col`}>
      {format() === 'image' && (
        <a
          href={file.url || url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${className} flex items-center overflow-hidden flex-col`}
        >
          <img
            src={file.url || url}
            alt="Miniatura de la imagen"
            className={`${!input && 'rounded'} ${className} object-cover ${
              !file.url && url ? 'blur' : ''
            }`}
          />
        </a>
      )}
      {format() === 'video' && (
        <>
          <video
            ref={videoRef}
            src={file.url || url}
            style={{ display: 'none' }}
            crossOrigin="anonymous"
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {thumbnail ? (
            <a
              href={file.url || url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${
                !input && 'rounded'
              } relative w-fit h-full flex items-center flex-col overflow-hidden`}
            >
              <img
                src={thumbnail}
                alt="Miniatura del video"
                className={`${!input && 'rounded'} ${className} object-cover ${
                  !file.url && url ? 'blur' : ''
                }`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="h-3/4 w-auto text-white bg-black bg-opacity-30 rounded-full p-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </a>
          ) : (
            <p className="text-secondary-900 h-full dark:text-white">
              <FaCircleNotch className="animate-spin h-full" />
            </p>
          )}
        </>
      )}
      {format() === 'audio' && (
        <a
          href={file.url || url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${className} flex items-center overflow-hidden flex-col`}
        >
          <BsFiletypeMp3
            className={`${
              !input && 'rounded'
            } ${className} h-full w-full p-4 text-primary-500 object-cover ${
              !file.url && url ? 'blur' : ''
            }`}
          />
        </a>
      )}
    </div>
  );
};

Thumbnail.propTypes = {
  className: PropTypes.string,
  file: PropTypes.object,
  url: PropTypes.string,
  input: PropTypes.bool
};
