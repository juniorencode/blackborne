import { SettingsLayout } from '../../../lib/layouts';

export const SettingsPage = () => {
  const breadcrumb = [
    {
      label: 'Configuraciones'
    }
  ];

  return <SettingsLayout breadcrumb={breadcrumb} />;
};
