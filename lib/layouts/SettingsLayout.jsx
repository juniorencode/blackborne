import PropTypes from 'prop-types';
import { useState } from 'react';
import { FaCheck } from 'react-icons/fa6';
import { cn } from '../utilities/styles.utilities';
import { primaryColors, secondaryColors } from '../utilities/theme.utilities';
import { BaseLayout } from '../layouts/BaseLayout';
import { Card } from '../components/Card';
import { ThemePreview } from '../components/ThemePreview';
import { Breadcrumb } from '../components/Breadcrumb';

export const SettingsLayout = props => {
  const { breadcrumb } = props;
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [accent, setAccent] = useState(
    localStorage.getItem('accent') || 'blue'
  );
  const [base, setBase] = useState(localStorage.getItem('base') || 'neutral');

  const handleChangeTheme = _theme => {
    switch (_theme) {
      case 'dark':
        document.body.classList.add('dark');
        break;
      case 'light':
        document.body.classList.remove('dark');
        break;
      case 'system':
        if (window.matchMedia('(prefers-color-scheme: dark)').matches)
          document.body.classList.add('dark');
        else document.body.classList.remove('dark');
        break;
      default:
        break;
    }

    localStorage.setItem('theme', _theme);
    setTheme(_theme);
  };

  const updateCSSVariables = (name, value) => {
    document.documentElement.style.setProperty(name, value);
  };

  const changePrimaryColor = color => {
    Object.keys(primaryColors[color]).map(weight =>
      updateCSSVariables(`--primary-${weight}`, primaryColors[color][weight])
    );
    localStorage.setItem('accent', color);
    setAccent(color);
  };

  const changeSecondaryColor = color => {
    Object.keys(secondaryColors[color]).map(weight =>
      updateCSSVariables(
        `--secondary-${weight}`,
        secondaryColors[color][weight]
      )
    );
    localStorage.setItem('base', color);
    setBase(color);
  };

  return (
    <BaseLayout>
      <div className="mb-2">
        <Breadcrumb options={breadcrumb} />
      </div>
      <h1 className="mb-4 text-3xl font-bold dark:text-white">
        Configuraciones
      </h1>
      <Card className="flex flex-col gap-8 py-2">
        <div className="p-4 space-y-8 max-h-[calc(100vh-190px)] sm:max-h-[calc(100vh-130px)] overflow-auto">
          <div>
            <h2 className="mb-2 w-min text-sm text-nowrap font-medium text-neutral-600 dark:text-neutral-300">
              Tema
            </h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <button
                  className={cn(
                    'relative border-4 rounded-lg overflow-hidden border-secondary-200 dark:border-secondary-700',
                    {
                      'border-primary-500 dark:border-primary-500':
                        theme === 'system'
                    }
                  )}
                  onClick={() => handleChangeTheme('system')}
                >
                  <ThemePreview
                    isDarkMode={
                      window.matchMedia('(prefers-color-scheme: dark)').matches
                    }
                  />
                  {theme === 'system' && (
                    <div className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full text-white bg-primary-500">
                      <FaCheck size={20} />
                    </div>
                  )}
                </button>
                <span className="dark:text-white font-semibold">Sistema</span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className={cn(
                    'relative border-4 rounded-lg overflow-hidden border-secondary-200 dark:border-secondary-700',
                    {
                      'border-primary-500 dark:border-primary-500':
                        theme === 'light'
                    }
                  )}
                  onClick={() => handleChangeTheme('light')}
                >
                  <ThemePreview />
                  {theme === 'light' && (
                    <div className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full text-white bg-primary-500">
                      <FaCheck size={20} />
                    </div>
                  )}
                </button>
                <span className="dark:text-white font-semibold">Claro</span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className={cn(
                    'relative border-4 rounded-lg overflow-hidden border-secondary-200 dark:border-secondary-700',
                    {
                      'border-primary-500 dark:border-primary-500':
                        theme === 'dark'
                    }
                  )}
                  onClick={() => handleChangeTheme('dark')}
                >
                  <ThemePreview isDarkMode />
                  {theme === 'dark' && (
                    <div className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full text-white bg-primary-500">
                      <FaCheck size={20} />
                    </div>
                  )}
                </button>
                <span className="dark:text-white font-semibold">Oscuro</span>
              </div>
            </div>
          </div>
          <div className="max-w-xl">
            <h2 className="mb-2 w-min text-sm text-nowrap font-medium text-neutral-600 dark:text-neutral-300">
              Color principal
            </h2>
            <div className="flex flex-wrap gap-4 py-2">
              {Object.keys(primaryColors).map(color => (
                <button
                  key={`${color}-primary`}
                  className={cn(
                    'group relative w-10 h-10 border-4 rounded-full hover:scale-110 transition-all border-neutral-300 dark:border-neutral-700',
                    {
                      'border-black dark:border-white': accent === color
                    }
                  )}
                  type="button"
                  style={{ background: `rgb(${primaryColors[color]['500']})` }}
                  onClick={() => changePrimaryColor(color)}
                >
                  <div className="absolute -top-full -translate-y-1 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 text-sm rounded-lg cursor-default text-white bg-black">
                    {color}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="max-w-xl">
            <h2 className="mb-2 w-min text-sm text-nowrap font-medium text-neutral-600 dark:text-neutral-300">
              Color base
            </h2>
            <div className="flex flex-wrap gap-4 py-2">
              {Object.keys(secondaryColors).map(color => (
                <button
                  key={`${color}-secondary`}
                  className={cn(
                    'group relative w-10 h-10 border-4 rounded-full hover:scale-110 transition-all border-neutral-300 dark:border-neutral-700',
                    {
                      'border-black dark:border-white': base === color
                    }
                  )}
                  type="button"
                  style={{
                    background: `rgb(${secondaryColors[color]['500']})`
                  }}
                  onClick={() => changeSecondaryColor(color)}
                >
                  <div className="absolute -top-full -translate-y-1 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 text-sm rounded-lg cursor-default text-white bg-black">
                    {color}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </BaseLayout>
  );
};

SettingsLayout.propTypes = {
  breadcrumb: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string
    })
  )
};
