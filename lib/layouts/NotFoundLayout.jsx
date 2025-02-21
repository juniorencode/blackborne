import { IoIosArrowRoundBack } from 'react-icons/io';
import { NavLink } from 'react-router-dom';

export const NotFoundLayout = () => {
  return (
    <div className="flex items-center w-full h-screen bg-secondary-100 dark:bg-secondary-900">
      <div className="p-4 sm:p-8">
        <p className="text-9xl font-black text-primary-500 dark:text-primary-400">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-secondary-800 dark:text-white md:text-3xl">
          No podemos encontrar esa página.
        </h1>
        <p className="mt-4 text-secondary-500 dark:text-secondary-400">
          Lo siento, la página que estás buscando no existe o ha sido movida.
        </p>

        <div className="flex items-center mt-6 gap-x-3">
          <button className="flex items-center justify-center w-1/2 px-5 py-2 text-sm text-secondary-700 transition-colors duration-200 bg-white border rounded-lg gap-x-2 sm:w-auto dark:hover:bg-secondary-700 dark:bg-secondary-800 hover:bg-secondary-100 dark:text-secondary-200 dark:border-secondary-700">
            <IoIosArrowRoundBack size={20} />
            <span>Volver atrás</span>
          </button>
          <NavLink
            to="/"
            className="w-1/2 px-5 py-2 text-sm text-center tracking-wide text-white transition-colors duration-200 bg-primary-500 rounded-lg shrink-0 sm:w-auto hover:bg-primary-600 dark:hover:bg-primary-500 dark:bg-primary-600"
          >
            Inicio
          </NavLink>
        </div>
      </div>
    </div>
  );
};
