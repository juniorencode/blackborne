import { useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { IoCloudUploadOutline } from 'react-icons/io5';
import { InputContainer } from '../InputContainer';
import { File } from './File';
import { cn } from '../../utilities/styles.utilities';

const InputFile = props => {
  const {
    className,
    label,
    name,
    accept,
    multiple,
    postFile,
    maxElem,
    putFile,
    register,
    required,
    disabled
  } = props;
  const inputFile = register(name, { required, maxElem });
  const urlFile = register('_' + name);
  const domId = useId();
  const [waiting, setWaiting] = useState([]);
  const [progress, setProgress] = useState();
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    if (waiting.length === 0 || progress) return;
    const file = waiting[waiting.length - 1];
    setWaiting(waiting.filter((_, index) => waiting.length - 1 !== index));
    setProgress({
      name: file.name,
      progress: 0,
      loaded: 0,
      total: file.size
    });
    postData(file);
    // eslint-disable-next-line
  }, [waiting, progress]);

  const postData = async file => {
    const formData = new FormData();
    formData.append('name', file.name);
    formData.append('file', file);
    const response = await postFile(formData, setProgress);
    if (inputFile.value)
      inputFile.handleChange([...inputFile.value, response.data?._id]);
    else inputFile.handleChange([response.data?._id]);
    if (urlFile.value) urlFile.handleChange([...urlFile.value, response.data]);
    else urlFile.handleChange([response.data]);
    setProgress(null);
  };

  const filterExtension = files => {
    return Array.from(files).filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      return accept.includes(extension);
    });
  };

  const handleUpload = selectedFiles => {
    const filteredFiles = filterExtension(selectedFiles);
    if (!filteredFiles) return;
    setWaiting(prev => [...prev, ...filteredFiles]);
  };

  const handleSelect = e => handleUpload(e.target.files);

  const handleDragOver = e => e.preventDefault();

  const handleDragEnter = () => !isOver && setIsOver(true);

  const handleDragLeave = () => isOver && setIsOver(false);

  const handleDrop = e => {
    e.preventDefault();
    let files = Array.from(e.dataTransfer.files);
    if (!multiple) {
      files = [files[files.length - 1]];
    }
    handleUpload(files);
    setIsOver(false);
  };

  const handleDelete = id => {
    inputFile.handleChange(inputFile.value.filter(objeto => objeto !== id));
    urlFile.handleChange(urlFile.value.filter(objeto => objeto._id !== id));
  };

  const handleUpdate = async (id, data, index) => {
    const value = [...urlFile.value];
    value[index].name = data?.name;
    urlFile.handleChange(value);
    await putFile(id, data);
  };

  const handleOpen = url => {
    window.open(url, '_blank');
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('draggedIndex', index);
  };

  const handleChangeOrder = (e, index2) => {
    const index1 = parseInt(e.dataTransfer.getData('draggedIndex'), 10);

    const swapItems = (arr, i, j) => {
      const newArr = [...arr];
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      return newArr;
    };

    // setUrlThumbnail(prevUrls => swapItems(prevUrls, index1, index2));

    const tempInputFile = swapItems(inputFile.value, index1, index2);
    inputFile.handleChange(tempInputFile);
    const newUrls = swapItems(urlFile.value, index1, index2);
    urlFile.handleChange(newUrls);
  };

  return (
    <InputContainer
      className={className}
      label={label}
      name={domId}
      error={inputFile.errors[name]?.message}
    >
      {!disabled &&
        (multiple ||
          (!progress && !inputFile.value) ||
          (inputFile.value?.length === 0 && !progress && multiple)) && (
          <label
            className={`flex justify-center w-full mt-2 p-5 text-center border-2 border-dashed cursor-pointer rounded-xl text-secondary-500 border-secondary-300 dark:text-secondary-400 dark:border-secondary-700 ${
              isOver ? 'bg-secondary-100 dark:bg-secondary-900' : ''
            }`}
            htmlFor={domId}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center pointer-events-none">
              <IoCloudUploadOutline size={32} />
              <h2 className="mt-1 font-medium tracking-wide text-secondary-700 dark:text-secondary-200">
                {isOver
                  ? 'Suelta tus archivo aquí'
                  : 'Selecciona o arrastra tu archivos aquí'}
              </h2>
              <p className="mt-2 text-xs tracking-wide text-secondary-500 dark:text-secondary-400">
                {accept
                  ? [...accept]
                      .slice(0, -1)
                      .map(elem => elem.toUpperCase())
                      .join(', ') +
                    ' o ' +
                    accept[accept.length - 1].toUpperCase()
                  : 'Todos los tipos de archivos son aceptados'}
              </p>
            </div>
            <input
              className="hidden"
              id={domId}
              type="file"
              onChange={handleSelect}
              multiple={multiple}
              accept={'.' + accept.join(',.')}
            />
          </label>
        )}
      <div
        className={cn('flex flex-col mt-4 gap-4', {
          'mt-0': disabled && (!inputFile.value || inputFile.value?.length < 1)
        })}
      >
        {inputFile.value?.map((_, index) => (
          <div
            key={index}
            draggable
            onDragStart={e => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={e => handleChangeOrder(e, index)}
          >
            <File
              name={urlFile.value?.[index].name}
              url={urlFile.value?.[index].url}
              total={urlFile.value?.[index].size}
              id={urlFile.value?.[index]._id}
              handleDelete={() => handleDelete(urlFile.value?.[index]._id)}
              handleUpdate={data =>
                handleUpdate(urlFile.value?.[index]._id, data, index)
              }
              handleOpen={() => handleOpen(urlFile.value?.[index].url)}
              disabled={disabled}
            />
          </div>
        ))}
        {progress && (
          <File
            name={progress.name}
            loaded={progress.loaded}
            total={progress.total}
            progress={progress.progress}
          />
        )}
        {waiting
          .slice()
          .reverse()
          .map((item, index) => (
            <File
              key={index}
              name={item.name}
              progress={0}
              loaded={0}
              total={item.size}
            />
          ))}
      </div>
      {disabled && (!inputFile.value || inputFile.value?.length < 1) && (
        <div className="p-4 w-full text-sm text-center italic border-2 rounded-lg text-secondary-400 border-secondary-700">
          No hay archivos disponibles
        </div>
      )}
    </InputContainer>
  );
};

InputFile.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  accept: PropTypes.array,
  maxElem: PropTypes.number,
  multiple: PropTypes.bool,
  register: PropTypes.func.isRequired,
  postFile: PropTypes.func.isRequired,
  putFile: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool
};

export { InputFile };
