import PropTypes from 'prop-types';
import { useState } from 'react';
import { FaFile } from 'react-icons/fa';
import { IoMdTrash } from 'react-icons/io';
import { MdDownload } from 'react-icons/md';
import { AiFillEdit } from 'react-icons/ai';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { useClickOutside } from '../../../hooks/useClickOutside.hook';
import { useForm } from '../../../hooks/useForm.hook';
import { useModal } from '../../../hooks/useModal.hook';
import { Modal } from '../../Modal';
import { InputText } from '../../InputText';
import { DataForm } from '../../DataForm';

const File = props => {
  const {
    name,
    url,
    progress = 0,
    loaded = 0,
    total = 0,
    handleDelete,
    handleUpdate,
    handleOpen,
    disabled
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const ModalUpdate = useModal();
  const FormUpdate = useForm();
  const dropdownRef = useClickOutside(() => setIsOpen(false));

  const formatSize = bytes => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
  };

  const handleModal = () => {
    ModalUpdate.openModal();
    setIsOpen(!isOpen);
    FormUpdate.setForm({ name: name });
  };

  const handleCancel = () => {
    ModalUpdate.closeModal();
    FormUpdate.reset();
  };

  FormUpdate.registerSubmit(async data => {
    try {
      handleUpdate(data);
    } finally {
      ModalUpdate.closeModal();
    }
  });

  return (
    <div className="relative flex flex-col gap-2 p-2 rounded-lg border text-secondary-500 dark:text-secondary-400 border-secondary-300 dark:border-secondary-600">
      <div className="flex justify-between">
        <div className="flex items-center gap-2 w-[calc(100%-2rem)]">
          <FaFile size={32} />
          <div className="flex flex-col overflow-hidden">
            {!url ? (
              <p className="whitespace-nowrap overflow-hidden overflow-ellipsis text-black dark:text-white">
                {name}
              </p>
            ) : (
              <a
                className="whitespace-nowrap overflow-hidden overflow-ellipsis text-black dark:text-white"
                href={url}
                target="_blank"
              >
                {name}
              </a>
            )}
            <p className="text-sm">
              {!url
                ? `${formatSize(loaded)} / ${formatSize(total)}`
                : formatSize(total)}
            </p>
          </div>
        </div>
        {!disabled && (
          <div className="flex items-center justify-center" ref={dropdownRef}>
            <button
              className="w-6 h-6 rounded-xl hover:text-black dark:hover:text-white"
              type="button"
              onClick={() => setIsOpen(!isOpen)}
            >
              <HiOutlineDotsVertical size={22} />
            </button>
            {isOpen && (
              <div className="absolute top-full right-0 z-20 my-2 w-44 rounded-lg shadow-3xl bg-white dark:bg-secondary-700">
                <ul className="py-2 text-sm text-black dark:text-secondary-200">
                  <li>
                    <button
                      className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-secondary-100 dark:hover:bg-secondary-600"
                      onClick={() => handleModal()}
                    >
                      <AiFillEdit size={16} />
                      Cambiar Nombre
                    </button>
                  </li>
                  <li>
                    <button
                      className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-secondary-100 dark:hover:bg-secondary-600"
                      onClick={() => {
                        handleOpen();
                        setIsOpen(!isOpen);
                      }}
                    >
                      <MdDownload size={16} />
                      Descargar
                    </button>
                  </li>
                  <li>
                    <button
                      className="flex items-center gap-2 px-4 py-2 w-full text-left text-red-600 dark:text-red-400 hover:bg-secondary-100 dark:hover:bg-secondary-600"
                      onClick={() => {
                        handleDelete();
                        setIsOpen(!isOpen);
                      }}
                    >
                      <IoMdTrash size={16} />
                      Borrar
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      {!url && (
        <div className="flex items-center gap-4">
          <div className="w-full rounded-full bg-secondary-100 dark:bg-secondary-700">
            <div
              className="h-1 rounded-full bg-blue-500"
              style={{
                width: Math.round(progress * 100) + '%'
              }}
            ></div>
          </div>
          <p className="text-sm">{Math.round(progress * 100)}%</p>
        </div>
      )}
      <Modal title="Cambiar Nombre" {...ModalUpdate.register}>
        <DataForm form={FormUpdate} handleCancel={handleCancel}>
          <form onKeyDown={FormUpdate.handleAssistant}>
            <InputText
              className="col-span-12 xl:col-span-5"
              name="name"
              placeholder="Nombre"
              register={FormUpdate.register}
              minLength={2}
              maxLength={800}
            />
          </form>
        </DataForm>
      </Modal>
    </div>
  );
};

File.propTypes = {
  name: PropTypes.string,
  url: PropTypes.string,
  progress: PropTypes.number,
  loaded: PropTypes.number,
  total: PropTypes.number,
  handleDelete: PropTypes.func,
  handleUpdate: PropTypes.func,
  handleOpen: PropTypes.func,
  handleUnlink: PropTypes.func,
  disabled: PropTypes.bool
};

export { File };
