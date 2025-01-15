import { Avatar, Card, CountBadge, Kbd, Tabs } from '../../../lib/main';
import { BaseLayout } from '../../../lib/layouts';
import { FaBoxOpen, FaUser, FaUserTie } from 'react-icons/fa';
import { MdStickyNote2 } from 'react-icons/md';

export const HomePage = () => {
  const tabs = [
    {
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet.',
      title: 'Welcome to the Homepage',
      tab: 'Home'
    },
    {
      content:
        'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
      title: 'Get to Know Us Better',
      tab: 'About'
    },
    {
      content:
        'Curabitur vel sem mi. Proin in lobortis ipsum. Sed fringilla mauris sit amet nibh.',
      title: 'Contact Us for More Information',
      tab: 'Contact'
    },
    {
      content:
        'Maecenas nec odio et ante tincidunt tempus. Vivamus elementum semper nisi.',
      title: 'Our Services',
      tab: 'Services'
    },
    {
      content:
        'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.',
      title: 'FAQ',
      tab: 'FAQ'
    }
  ];

  return (
    <BaseLayout className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="px-4">
          <CountBadge
            title="Users"
            count={12}
            to="https://juniorencode.com/"
            icon={<FaUser size={24} />}
          />
        </Card>
        <Card className="px-4">
          <CountBadge
            title="Customers"
            count={12}
            to="https://juniorencode.com/"
            icon={<FaUserTie size={24} />}
          />
        </Card>
        <Card className="px-4">
          <CountBadge
            title="Providers"
            count={12}
            to="https://juniorencode.com/"
            icon={<FaBoxOpen size={24} />}
          />
        </Card>
        <Card className="px-4">
          <CountBadge
            title="Notes"
            count={12}
            to="https://juniorencode.com/"
            icon={<MdStickyNote2 size={24} />}
          />
        </Card>
      </div>
      <Card className="flex gap-4 p-4">
        <div>
          <Avatar name="Jane Doe" color="primary" />
        </div>
        <div>
          <Avatar
            src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg"
            color="secondary"
            name="Gloria"
          />
        </div>
      </Card>
      <Card className="flex flex-col gap-2 p-4 text-sm dark:text-white">
        <div>
          Presiona <Kbd size="sm">Ctrl</Kbd> + <Kbd size="sm">C</Kbd> para
          copiar
        </div>
        <div>
          <Kbd color="primary">Esc</Kbd> para salir
        </div>
        <div>
          Presiona <Kbd size="lg">Enter</Kbd> para continuar
        </div>
      </Card>
      <Card>
        <Tabs openDefault={3} tabs={tabs} disabled={[1, 4]} />
      </Card>
    </BaseLayout>
  );
};
