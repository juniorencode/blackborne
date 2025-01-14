import { useState } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { IoMdClose } from 'react-icons/io';
import { IoAlertCircleOutline } from 'react-icons/io5';
import { Button } from '../Button';

export const Alert = props => {
  const { domRef, isOpen, closeAlert, handleConfirm, handleCancel } = props;
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;

  const handleConfirmButton = async () => {
    try {
      setLoading(true);
      if (handleConfirm) await handleConfirm();
    } finally {
      setLoading(false);
      closeAlert();
    }
  };

  const handleCancelButton = () => {
    if (handleCancel) handleCancel();
    closeAlert();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-70 bg-black">
      <div className="relative p-4 w-full max-w-md max-h-full" ref={domRef}>
        <div className="relative border rounded-lg shadow bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700">
          <button
            className="absolute top-3 inline-flex justify-center items-center ms-auto w-8 h-8 text-sm end-2.5 focus:ring-4 focus:ring-opacity-40 rounded-lg text-secondary-400 hover:text-secondary-900 dark:hover:text-white bg-transparent hover:bg-secondary-200 dark:hover:bg-secondary-600 focus:ring-primary-500"
            onClick={closeAlert}
          >
            <IoMdClose size={20} />
          </button>
          <div className="p-4 md:p-5 text-center">
            <div className="flex justify-center py-4">
              <IoAlertCircleOutline
                className="dark:text-secondary-100"
                size={72}
              />
            </div>
            <h3 className="mb-5 text-lg font-normal text-secondary-500 dark:text-secondary-400">
              ¿Estás seguro de que deseas eliminar este registro?
            </h3>
            <div className="flex justify-center gap-4">
              <Button
                color="Red"
                disabled={loading}
                onClick={handleConfirmButton}
              >
                {loading ? 'Eliminando...' : 'Si, estoy seguro'}
              </Button>
              <Button
                className="hover:underline dark:hover:underline bg-transparent dark:bg-transparent hover:bg-transparent dark:hover:bg-transparent"
                onClick={handleCancelButton}
              >
                No, cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('portal')
  );
};

Alert.propTypes = {
  domRef: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  closeAlert: PropTypes.func.isRequired,
  handleConfirm: PropTypes.func,
  handleCancel: PropTypes.func
};
