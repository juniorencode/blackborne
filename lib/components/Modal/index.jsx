import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { IoMdClose } from 'react-icons/io';

const Modal = props => {
  const { children, isOpen, closeModal, domRef, title } = props;
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="relative p-4 w-full max-w-xl max-h-full" ref={domRef}>
        <div className="relative bg-white rounded-lg shadow-3xl dark:bg-secondary-800">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-secondary-600">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
              {title}
            </h3>
            <button
              className="text-secondary-400 bg-transparent hover:bg-secondary-200 hover:text-secondary-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-secondary-600 dark:hover:text-white"
              onClick={closeModal}
            >
              <IoMdClose size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.getElementById('portal')
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
  domRef: PropTypes.object.isRequired,
  children: PropTypes.node,
  title: PropTypes.string
};

export { Modal };
