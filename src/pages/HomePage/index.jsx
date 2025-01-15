import { Card, CountBadge } from '../../../lib/main';
import { BaseLayout } from '../../../lib/layouts';
import { FaBoxOpen, FaUser, FaUserTie } from 'react-icons/fa';
import { MdStickyNote2 } from 'react-icons/md';

export const HomePage = () => {
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
    </BaseLayout>
  );
};
