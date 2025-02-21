import PropTypes from 'prop-types';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import { PiWarningFill } from 'react-icons/pi';
import { IoMdClose } from 'react-icons/io';
import { cn } from '../../utilities/styles.utilities';
import './Toast.css';

const ToastContext = React.createContext(null);
const TIMEOUT_DURATION = 3000;
const ICON_MAP = {
  success: <FaCheckCircle />,
  error: <FaTimesCircle />,
  warning: <PiWarningFill />,
  info: <FaInfoCircle />
};
const LABEL_MAP = {
  success: 'Felicitaciones:',
  error: 'Error:',
  warning: 'Advertencia:',
  info: 'Información:'
};
const TOAST_CLASS_MAP = {
  success:
    'text-green-700 dark:text-green-50 bg-green-50 dark:bg-green-800 border-green-500 dark:border-green-300',
  error:
    'text-red-700 dark:text-red-50 bg-red-50 dark:bg-red-800 border-red-500 dark:border-red-300',
  warning:
    'text-yellow-700 dark:text-yellow-50 bg-yellow-50 dark:bg-yellow-800 border-yellow-500 dark:border-yellow-300',
  info: 'text-blue-700 dark:text-blue-50 bg-blue-50 dark:bg-blue-800 border-blue-500 dark:border-blue-300'
};
const ICON_CLASS_MAP = {
  success: 'text-green-500 dark:text-green-300',
  error: 'text-red-500 dark:text-red-300',
  warning: 'text-yellow-500 dark:text-yellow-300',
  info: 'text-blue-500 dark:text-blue-300'
};
const BUTTON_CLASS_MAP = {
  success:
    'bg-green-200 dark:bg-green-900 hover:bg-green-400/50 dark:hover:bg-green-950/50',
  error:
    'bg-red-200 dark:bg-red-900 hover:bg-red-400/50 dark:hover:bg-red-950/50',
  warning:
    'bg-yellow-200 dark:bg-yellow-900 hover:bg-yellow-400/50 dark:hover:bg-yellow-950/50',
  info: 'bg-blue-200 dark:bg-blue-900 hover:bg-blue-400/50 dark:hover:bg-blue-950/50'
};

const TEXT_CLASS_MAP = {
  success: 'text-green-500 dark:text-green-700',
  error: 'text-red-500 dark:text-red-700',
  warning: 'text-yellow-500 dark:text-yellow-700',
  info: 'text-blue-500 dark:text-blue-700'
};

export const ToastProvider = props => {
  const { children } = props;
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const newToast = { type, message, id: Date.now(), visible: true };

    setToasts(prevToasts => {
      const updatedToasts = [...prevToasts, newToast];
      if (updatedToasts.length > 5) updatedToasts.shift();
      return updatedToasts;
    });
  }, []);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
};

const ToastContainer = props => {
  const { toasts } = props;

  return createPortal(
    <div className="fixed top-0 right-0 z-50 flex flex-col items-end gap-2 p-4">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  );
};

ToastContainer.propTypes = {
  toasts: PropTypes.array.isRequired
};

const ToastItem = props => {
  const { toast } = props;
  const { removeToast } = useToast();
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const start = Date.now() - elapsedTime;

    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        const newElapsedTime = Date.now() - start;
        const newProgress = Math.min(
          (newElapsedTime / TIMEOUT_DURATION) * 100,
          100
        );
        setElapsedTime(newElapsedTime);
        setProgress(newProgress);
        if (newProgress >= 100) {
          toast.visible = false;
          setTimeout(() => {
            handleClose();
          }, 400);
          clearInterval(intervalRef.current);
        }
      }, 50);
    }

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [isPaused, elapsedTime]);

  const handleClose = () => removeToast(toast.id);

  const handleMouseEnter = () => {
    setIsPaused(true);
    clearInterval(intervalRef.current);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div
      className={cn(
        'grid max-w-md border-l-4 rounded-lg shadow-lg overflow-hidden',
        {
          'toast-enter': toast.visible,
          'toast-exit': !toast.visible
        },
        TOAST_CLASS_MAP[toast.type]
      )}
      style={{ gridTemplateColumns: 'auto 1fr auto' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          'flex items-center justify-center text-xl w-10 h-full min-h-10',
          ICON_CLASS_MAP[toast.type]
        )}
      >
        {ICON_MAP[toast.type]}
      </div>
      <div className="flex items-center">
        <p className="mr-3 py-2 text-sm">
          <span className="mr-1 font-semibold">{LABEL_MAP[toast.type]}</span>
          {toast.message}
        </p>
      </div>
      <ProgressCircle
        progress={progress}
        type={toast.type}
        handleClose={handleClose}
      />
    </div>
  );
};

ToastItem.propTypes = {
  toast: PropTypes.object.isRequired
};

const ProgressCircle = props => {
  const { type, progress, handleClose } = props;

  return (
    <button
      className={cn(
        'relative flex items-center justify-center w-10 h-full min-h-10 transition',
        BUTTON_CLASS_MAP[type]
      )}
      type="button"
      onClick={handleClose}
    >
      <svg
        className={cn(
          'absolute top-0 left-0 w-full h-full',
          TEXT_CLASS_MAP[type]
        )}
        viewBox="0 0 40 40"
      >
        <circle
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          r={12}
          cx="50%"
          cy="50%"
          strokeDasharray={75.398}
          strokeDashoffset={75.398 - (75.398 * progress) / 100}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      <IoMdClose />
    </button>
  );
};

ProgressCircle.propTypes = {
  type: PropTypes.string.isRequired,
  progress: PropTypes.number.isRequired,
  handleClose: PropTypes.func.isRequired
};

// eslint-disable-next-line
export const useToast = () => {
  const context = React.useContext(ToastContext);
  return context;
};
