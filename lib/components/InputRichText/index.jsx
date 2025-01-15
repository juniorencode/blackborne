import PropTypes from 'prop-types';
import { useState, useRef, useEffect, useId } from 'react';
import {
  ImBold,
  ImItalic,
  ImList2,
  ImListNumbered,
  ImUnderline
} from 'react-icons/im';
import { IoIosCheckmark, IoIosClose, IoMdLink } from 'react-icons/io';
import { cn } from '../../utilities/styles.utilities';
import { useClickOutside } from '../../hooks/useClickOutside.hook';
import { InputContainer } from '../InputContainer';
import { InputSelect } from './InputSelect';
import { Button } from './Button';
import './styles.css';

export const InputRichText = props => {
  const { className, name, label, register, required } = props;

  const domId = useId();
  const contentEditableRef = useRef(null);
  const selectionRef = useRef(null);
  const content = useRef(null);
  const [inputLink, setInputLink] = useState('');
  const [savedRange, setSavedRange] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const modalRef = useClickOutside(() => setIsFormOpen(false));
  const { errors, value, handleChange } = register(name, { required });

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        document.queryCommandValue('fontSize');
      }
    };

    const handleInput = () => updateHtmlContent();
    const currentContentEditable = contentEditableRef.current;

    if (currentContentEditable) {
      document.addEventListener('selectionchange', handleSelectionChange);
      currentContentEditable.addEventListener('input', handleInput);
    }

    return () => {
      if (currentContentEditable) {
        document.removeEventListener('selectionchange', handleSelectionChange);
        currentContentEditable.removeEventListener('input', handleInput);
      }
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const updateEditorContent = content => {
      if (
        contentEditableRef.current &&
        contentEditableRef.current.innerHTML === ''
      ) {
        contentEditableRef.current.innerHTML = content;
      }
    };
    updateEditorContent(value || '');
  }, [value]);

  const handlePaste = e => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const updateHtmlContent = () =>
    handleChange(contentEditableRef.current.innerHTML);

  const handleKeyDown = e => e.key === 'Enter' && e.stopPropagation();

  const cursorRef = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }

    if (selectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }
    if (!window.getSelection().toString()) {
      document.execCommand('fontSize', false, event.target.value);
    }
  };

  const handleBoldClick = e => {
    e.preventDefault();
    cursorRef();
    document.execCommand('bold', false, null);
    updateHtmlContent();
  };

  const handleItalicClick = e => {
    e.preventDefault();
    cursorRef();
    document.execCommand('italic', false, null);
    updateHtmlContent();
  };

  const handleOrderedListClick = e => {
    e.preventDefault();
    cursorRef();
    document.execCommand('insertOrderedList', false, null);
    updateHtmlContent();
  };

  const handleUnorderedListClick = e => {
    e.preventDefault();
    cursorRef();
    document.execCommand('insertUnorderedList', false, null);
    updateHtmlContent();
  };

  const handleUnderlineClick = e => {
    e.preventDefault();
    cursorRef();
    document.execCommand('underline', false, null);
    updateHtmlContent();
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      setSavedRange(selection.getRangeAt(0).cloneRange());
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (savedRange) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
  };

  const toggleForm = e => {
    e.preventDefault();

    if (isFormOpen) {
      setIsFormOpen(false);
      return;
    }

    const selection = window.getSelection();
    setIsFormOpen(true);
    saveSelection();

    if (selection.rangeCount > 0) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }

    const range = selection.getRangeAt(0);
    const box = content?.current?.getBoundingClientRect();
    const scrollTop = content?.current?.scrollTop;
    const rect = range.getBoundingClientRect();
    const modalWidth = 300;

    const top = rect.bottom - box.top + scrollTop;
    const left =
      rect.left + (rect.right - rect.left) / 2 - box.left - modalWidth / 2;

    modalRef.current.style.top =
      (top > 0
        ? top + 36 < content?.current?.scrollHeight
          ? top
          : content?.current?.scrollHeight - (rect.height * 2 + 36)
        : 0) + 'px';

    modalRef.current.style.left =
      (left > 0
        ? left + modalWidth < box.width
          ? left
          : box.width - modalWidth
        : 0) + 'px';
  };

  const handleLink = e => {
    e.preventDefault();
    restoreSelection();
    contentEditableRef.current.focus();
    const selectionToLink = selectionRef.current;

    if (inputLink.trim() !== '') {
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${inputLink}" target="_blank">${selectionToLink.toString()}</a>`
      );
      updateHtmlContent();
    }

    setInputLink('');
    setIsFormOpen(false);
  };

  const handleCancelLink = e => {
    e.preventDefault();
    setInputLink('');
    setIsFormOpen(false);
  };

  const handleHeadingChange = value => {
    if (value === 'none') document.execCommand('formatBlock', false, '<div>');
    else document.execCommand('formatBlock', false, value);

    updateHtmlContent();
  };

  const handleSizeChange = value => {
    const selection = window.getSelection();

    if (selection.rangeCount > 0) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }

    document.execCommand('fontSize', false, value);

    if (selectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }

    if (!window.getSelection().toString()) {
      document.execCommand('fontSize', false, value);
    }
  };

  const headings = [
    { value: 'none', label: 'Normal' },
    { value: 'h2', label: 'Título 2' },
    { value: 'h3', label: 'Título 3' },
    { value: 'h4', label: 'Título 4' },
    { value: 'h5', label: 'Título 5' },
    { value: 'h6', label: 'Título 6' }
  ];

  const sizes = [
    { value: '1', label: '12' },
    { value: '2', label: '14' },
    { value: '3', label: '16' },
    { value: '4', label: '18' },
    { value: '5', label: '20' },
    { value: '6', label: '22' },
    { value: '7', label: '24' }
  ];

  return (
    <InputContainer
      className={className}
      label={label}
      name={domId}
      error={errors[name]?.message}
    >
      <div className="rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 p-2 bg-secondary-300 dark:bg-secondary-900">
          <InputSelect
            className="w-24"
            options={headings}
            handleChange={handleHeadingChange}
          />
          <InputSelect
            className="w-16"
            options={sizes}
            handleChange={handleSizeChange}
          />
          <Button onClick={handleBoldClick} icon={<ImBold />} />
          <Button onClick={handleItalicClick} icon={<ImItalic />} />
          <Button onClick={handleUnderlineClick} icon={<ImUnderline />} />
          <Button onClick={handleUnorderedListClick} icon={<ImList2 />} />
          <Button onClick={handleOrderedListClick} icon={<ImListNumbered />} />
          <Button onClick={toggleForm} icon={<IoMdLink />} />
        </div>
        <div
          className="relative rounded-b-lg border border-t-0 overflow-hidden border-secondary-300 dark:border-secondary-600"
          ref={content}
        >
          <div
            className="RichTextEditor p-4 min-h-96 outline-none bg-secondary-50 dark:bg-secondary-700 text-black dark:text-white"
            id={domId}
            ref={contentEditableRef}
            contentEditable
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
          ></div>
          <div
            className={cn(
              'absolute top-0 left-0 flex items-center gap-1 p-1 w-[300px] rounded-lg shadow-3xl invisible bg-white dark:bg-secondary-900',
              {
                visible: isFormOpen
              }
            )}
            ref={modalRef}
          >
            <input
              className="px-2 py-1 w-full text-sm outline-none bg-transparent text-neutral-400"
              type="text"
              placeholder="Enlace"
              value={inputLink}
              onChange={e => setInputLink(e.target.value)}
            />
            <button
              className="w-6 h-6 text-neutral-600 hover:text-blue-500"
              type="button"
              onClick={handleLink}
            >
              <IoIosCheckmark size={24} />
            </button>
            <button
              className="w-6 h-6 text-neutral-600 hover:text-red-500"
              type="button"
              onClick={handleCancelLink}
            >
              <IoIosClose size={24} />
            </button>
          </div>
        </div>
      </div>
    </InputContainer>
  );
};

InputRichText.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  register: PropTypes.func,
  required: PropTypes.bool
};
