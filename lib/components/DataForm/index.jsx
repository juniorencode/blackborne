import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utilities/styles.utilities';
import { Button } from '../Button';

export const DataForm = props => {
  const { children, className, form, handleCancel, modal } = props;
  const navigate = useNavigate();

  const handleBack = () => {
    if (handleCancel) handleCancel();
    else navigate(-1, { replace: true });
  };

  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-2 mt-2 p-4 max-h-[calc(100vh_-_257px)] sm:max-h-[calc(100vh_-_195px)] overflow-auto scroll-container',
          {
            'max-h-[calc(100vh_-_220px)]': modal
          },
          className
        )}
      >
        {children}
      </div>
      <form
        className="flex justify-between p-4 border-t border-secondary-200 dark:border-secondary-600"
        onSubmit={form.handleSubmit}
      >
        <Button
          className="hover:underline text-black dark:text-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-0 hover:dark:bg-opacity-0"
          onClick={handleBack}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={form.pending}>
          {form.pending ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </>
  );
};

DataForm.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  form: PropTypes.object.isRequired,
  handleCancel: PropTypes.func,
  modal: PropTypes.bool
};
