import PropTypes from 'prop-types';
import { cn } from '../utilities/styles.utilities';
import { primaryColors, secondaryColors } from '../utilities/theme.utilities';
import { BaseLayout } from '../layouts/BaseLayout';
import { Card } from '../components/Card';
import { ThemePreview } from '../components/ThemePreview';
import { Breadcrumb } from '../components/Breadcrumb';

export const SettingsLayout = props => {
  const { breadcrumb } = props;

  return (
    <BaseLayout>
      <div className="mb-2">
        <Breadcrumb options={breadcrumb} />
      </div>
      <h1 className="mb-4 text-3xl font-bold dark:text-white">
        Configuraciones
      </h1>
      <Card className="flex flex-col gap-8 py-2">
        <div className="p-4 max-h-[calc(100vh-190px)] sm:max-h-[calc(100vh-130px)] overflow-auto">
          <div>
            <h2 className="mb-2 w-min text-sm text-nowrap font-medium text-neutral-600 dark:text-neutral-300">
              Tema
            </h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <button
                  className={cn(
                    'relative border-4 rounded-lg overflow-hidden border-secondary-200 dark:border-secondary-700'
                  )}
                >
                  <ThemePreview
                    isDarkMode={
                      window.matchMedia('(prefers-color-scheme: dark)').matches
                    }
                  />
                </button>
                <span className="dark:text-white font-semibold">Sistema</span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className={cn(
                    'relative border-4 rounded-lg overflow-hidden border-secondary-200 dark:border-secondary-700'
                  )}
                >
                  <ThemePreview />
                </button>
                <span className="dark:text-white font-semibold">Claro</span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className={cn(
                    'relative border-4 rounded-lg overflow-hidden border-secondary-200 dark:border-secondary-700'
                  )}
                >
                  <ThemePreview isDarkMode />
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
                    'group relative w-10 h-10 border-4 rounded-full hover:scale-110 transition-all border-neutral-300 dark:border-neutral-700'
                  )}
                  type="button"
                  style={{ background: `rgb(${primaryColors[color]['500']})` }}
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
                    'group relative w-10 h-10 border-4 rounded-full hover:scale-110 transition-all border-neutral-300 dark:border-neutral-700'
                  )}
                  type="button"
                  style={{
                    background: `rgb(${secondaryColors[color]['500']})`
                  }}
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
