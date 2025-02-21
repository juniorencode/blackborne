import { MdStickyNote2 } from 'react-icons/md';
import { FaBoxOpen, FaUser, FaUserTie } from 'react-icons/fa';
import {
  Accordion,
  AccordionItem,
  Avatar,
  Badge,
  BarChart,
  Button,
  Card,
  CountBadge,
  Kbd,
  Stepper,
  StepperItem,
  Tabs,
  useToast
} from '../../../lib/main';
import { BaseLayout } from '../../../lib/layouts';

export const HomePage = () => {
  const { addToast } = useToast();

  const values = [72, 56, 20, 36, 80, 40, 30, 20, 25, 30, 12, 60];
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];

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

  const handleSuccess = () => {
    addToast('success', 'Este es un mensaje de éxito');
  };

  const handleError = () => {
    addToast('error', 'Este es un mensaje de error');
  };

  const handleWarning = () => {
    addToast('warning', 'Este es un mensaje de advertencia');
  };

  const handleInfo = () => {
    addToast('info', 'Este es un mensaje informativo');
  };

  return (
    <BaseLayout className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Badge label="2" position="right" color="red">
          <Card className="px-4">
            <CountBadge
              title="Users"
              count={12}
              to="https://juniorencode.com/"
              icon={<FaUser size={24} />}
            />
          </Card>
        </Badge>
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
      <Card className="col-span-12 lg:col-span-7 xl:col-span-8 2xl:col-span-9 flex flex-col gap-4 p-4">
        <BarChart
          title="Transacciones del 2024"
          options={{
            type: 'bar',
            data: {
              labels: months,
              datasets: [
                {
                  data: values,
                  borderWidth: 2
                }
              ]
            }
          }}
          height={4}
        />
      </Card>
      <Card className="flex flex-wrap gap-2 p-4">
        <Button
          className="px-3 py-1.5 rounded text-white bg-green-600 hover:bg-green-700"
          onClick={handleSuccess}
        >
          Success Toast
        </Button>
        <Button
          className="px-3 py-1.5 rounded text-white bg-red-600 hover:bg-red-700"
          onClick={handleError}
        >
          Error Toast
        </Button>
        <Button
          className="px-3 py-1.5 rounded text-white bg-yellow-600 hover:bg-yellow-700"
          onClick={handleWarning}
        >
          Warning Toast
        </Button>
        <Button
          className="px-3 py-1.5 rounded text-white bg-blue-600 hover:bg-blue-700"
          onClick={handleInfo}
        >
          Info Toast
        </Button>
      </Card>
      <Card className="flex gap-4 p-4">
        <Badge label="2" position="right">
          <Avatar name="Jane Doe" color="primary" />
        </Badge>
        <Avatar
          src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg"
          color="secondary"
          name="Gloria"
        />
      </Card>
      <Card className="flex flex-col gap-2 p-4 text-sm dark:text-white">
        <div>
          Press <Kbd size="sm">Ctrl</Kbd> + <Kbd size="sm">C</Kbd> to copy
        </div>
        <div>
          <Kbd color="primary">Esc</Kbd> to exit
        </div>
        <div>
          Press <Kbd size="lg">Enter</Kbd> to continue
        </div>
      </Card>
      <Card>
        <Tabs openDefault={3} tabs={tabs} disabled={[1, 4]} />
      </Card>
      <Card>
        <Accordion openDefault={2} multiple>
          <AccordionItem title="Home" subtitle="Press to expand" disabled>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus
            imperdiet.
          </AccordionItem>
          <AccordionItem title="About">
            Pellentesque habitant morbi tristique senectus et netus et malesuada
            fames ac turpis egestas.
          </AccordionItem>
          <AccordionItem title="Contact" subtitle="Press to expand">
            Curabitur vel sem mi. Proin in lobortis ipsum. Sed fringilla mauris
            sit amet nibh.
          </AccordionItem>
          <AccordionItem title="Services" subtitle="Press to expand">
            Maecenas nec odio et ante tincidunt tempus. Vivamus elementum semper
            nisi.
          </AccordionItem>
          <AccordionItem title="FAQ">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, totam rem aperiam.
          </AccordionItem>
        </Accordion>
      </Card>
      <Card>
        <Accordion
          openDefault={2}
          multiple
          data={[
            {
              title: 'Home',
              subtitle: 'Press to expand',
              content:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet.',
              disabled: true
            },
            {
              title: 'About',
              content:
                'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.'
            },
            {
              title: 'Contact',
              subtitle: 'Press to expand',
              content:
                'Curabitur vel sem mi. Proin in lobortis ipsum. Sed fringilla mauris sit amet nibh.'
            },
            {
              title: 'Services',
              subtitle: 'Press to expand',
              content:
                'Maecenas nec odio et ante tincidunt tempus. Vivamus elementum semper nisi.'
            },
            {
              title: 'FAQ',
              content:
                'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.'
            }
          ]}
        ></Accordion>
      </Card>
      <Card className="p-4">
        <Stepper>
          <StepperItem title="Home">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus
            imperdiet.
          </StepperItem>
          <StepperItem title="About">
            Pellentesque habitant morbi tristique senectus et netus et malesuada
            fames ac turpis egestas.
          </StepperItem>
          <StepperItem title="Contact">
            Curabitur vel sem mi. Proin in lobortis ipsum. Sed fringilla mauris
            sit amet nibh.
          </StepperItem>
        </Stepper>
      </Card>
    </BaseLayout>
  );
};
