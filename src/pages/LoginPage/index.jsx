import { BaseLayout, LoginLayout } from '../../../lib/layouts';
import { useForm } from '../../../lib/hooks';

export const LoginPage = () => {
  const FormLogin = useForm({
    email: localStorage.getItem('savedEmail') || '',
    password: '',
    remember: Boolean(localStorage.getItem('savedEmail'))
  });

  FormLogin.registerSubmit(async data => {
    if (data.remember) localStorage.setItem('savedEmail', data.email);
    else localStorage.removeItem('savedEmail');
  });

  return (
    <BaseLayout className="p-0">
      <LoginLayout form={FormLogin} name={'Cotrina Exports E.I.R.L. '} />
    </BaseLayout>
  );
};
