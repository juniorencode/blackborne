import PropTypes from 'prop-types';
import { useState } from 'react';
import { cn } from '../../utilities/styles.utilities';

export const Avatar = props => {
  const { className, src, name, color } = props;
  const [imageError, setImageError] = useState(false);

  const getInitial = () => {
    return name ? name.charAt(0).toUpperCase() : '';
  };

  const colorClasses = {
    primary: 'bg-primary-500 text-white',
    secondary: 'bg-secondary-500 text-white'
  };

  return (
    <div
      className={`${className} flex items-center justify-center w-12 h-12 font-bold  rounded-full select-none ${
        !src || imageError
          ? !color
            ? 'dark:bg-gray-800 dark:text-white bg-gray-200 text-gray-800'
            : colorClasses[color]
          : ''
      }`}
    >
      {src && !imageError ? (
        <img
          className={cn('w-full h-full object-cover rounded-full')}
          src={src}
          alt={name}
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{getInitial()}</span>
      )}
    </div>
  );
};

Avatar.propTypes = {
  className: PropTypes.string,
  src: PropTypes.string,
  name: PropTypes.string.isRequired,
  color: PropTypes.string
};
