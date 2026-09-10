/*
 * The visual catalog for Avatar.
 *
 * WHAT TO LOOK AT is the row. This component is sized off the control heights
 * rather than off a scale of its own, and the whole reason is alignment: an
 * avatar beside a button, a field or a table cell has to line up with it, and
 * `In a row` is where that claim is either true or obviously false.
 *
 * THE PHOTOGRAPH IS A DATA URI, deliberately. A story that fetched a picture
 * would make its baseline depend on the network, which is doc 10 §11's rule
 * about a check measuring the machine arriving through the back door. The
 * broken one below is a url that cannot resolve, which is the only honest way
 * to photograph a failure.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, type AvatarSize } from './Avatar';
import { Button } from '../Button';
import { TextField } from '../TextField';

const SIZES = ['sm', 'md', 'lg'] as const;

/** A picture, with no network in it. */
const PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
       <rect width="64" height="64" fill="#3e63dd"/>
       <circle cx="32" cy="24" r="12" fill="#c7d2fe"/>
       <path d="M8 64c0-14 11-22 24-22s24 8 24 22z" fill="#c7d2fe"/>
     </svg>`
  );

/*
 * AN IMAGE THAT CANNOT DECODE, rather than a url that 404s.
 *
 * It was `/nothing-here.png`, and what a static server answers for an unknown
 * path is not this library's business: a fallback SPA page returns 200 and the
 * browser then fails to decode it, which takes longer than a 404 and takes a
 * different amount of time on a different machine. A data uri holding
 * nonsense fails without a request at all, so the fallback is reached the same
 * way everywhere.
 */
const BROKEN = 'data:image/png;base64,bm90LWFuLWltYWdl';

/** One scope of the theme axes, with a label. */
function Scope({
  label,
  mode = 'light',
  density = 'normal',
  children
}: {
  label: string;
  mode?: 'light' | 'dark';
  density?: 'normal' | 'compact';
  children: React.ReactNode;
}) {
  return (
    <div
      className="catalog-panel"
      data-bb-mode={mode}
      data-bb-density={density}
    >
      <p className="catalog-label">{label}</p>
      {children}
    </div>
  );
}

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  args: { name: 'Carlos Ramos', children: 'CR' }
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A picture of somebody, with something in its place when there is none.
 *
 * **The library does not make the initials.** "CR" is passed in, because
 * turning "Carlos Ramos" into it is a locale-dependent transformation that
 * fails in more languages than it works in — doc 05 §4.2 has the list. What is
 * passed in as a prop is the FULL name, which is what a screen reader gets:
 * the screen says "CR" and a reader says "Carlos Ramos".
 */
export const Overview: Story = {
  render: args => (
    <div className="catalog-row">
      <Avatar {...args} src={PHOTO} />
      <Avatar {...args} />
    </div>
  )
};

/**
 * EVERY STATE, in both modes.
 *
 * Three sizes with a picture, three without, and one whose picture does not
 * arrive — which is the same result as having none, reached a different way.
 *
 * The border is not decoration: an avatar holds an image the library has never
 * seen, and a photograph with pale edges on a pale surface has no edge at all.
 */
export const States: Story = {
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Light', 'light'],
          ['Dark', 'dark']
        ] as const
      ).map(([label, mode]) => (
        <Scope key={label} label={label} mode={mode}>
          <div className="catalog-stack">
            <div className="catalog-row">
              {SIZES.map(size => (
                <Avatar
                  key={size}
                  name="Carlos Ramos"
                  size={size as AvatarSize}
                  src={PHOTO}
                >
                  CR
                </Avatar>
              ))}
            </div>
            <div className="catalog-row">
              {SIZES.map(size => (
                <Avatar key={size} name="Ana Vega" size={size as AvatarSize}>
                  AV
                </Avatar>
              ))}
            </div>
            <div className="catalog-row">
              <Avatar name="Broken picture" src={BROKEN}>
                BP
              </Avatar>
              <Avatar name="A monogram">
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="6" r="3" fill="currentColor" />
                  <path
                    d="M2 15c0-3.3 2.7-5 6-5s6 1.7 6 5z"
                    fill="currentColor"
                  />
                </svg>
              </Avatar>
              <Avatar name="A long one">ÁÉÍ</Avatar>
            </div>
          </div>
        </Scope>
      ))}
    </div>
  )
};

/**
 * IN A ROW WITH CONTROLS, which is what the sizing is for.
 *
 * Each avatar is beside a button and a field of the same size. They share
 * `--bb-control-height-*`, so the row lines up and compact density moves all
 * three at once — an avatar with a scale of its own would be the one thing in
 * a dense table that did not get the message.
 */
export const InARow: Story = {
  name: 'In a row',
  render: () => (
    <Scope label="Light">
      <div className="catalog-stack">
        {SIZES.map(size => (
          <div key={size} className="catalog-row">
            <Avatar
              name="Carlos Ramos"
              size={size as AvatarSize}
              src={PHOTO}
              isDecorative
            >
              CR
            </Avatar>
            <span>Carlos Ramos</span>
            <Button size={size}>Open</Button>
            {/*
             * A width, because a field is `w-full` and would otherwise take
             * the whole row and wrap onto a line of its own — which is what
             * the first baseline of this story showed, with the check passing
             * because the heights were right and the picture showing nothing
             * about the row.
             */}
            <div style={{ width: 160 }}>
              <TextField label="Reference" size={size} isLabelHidden />
            </div>
          </div>
        ))}
      </div>
    </Scope>
  )
};

/**
 * BESIDE THE NAME IT BELONGS TO, which is when it is decorative.
 *
 * The name is still a required prop — it always is — and `isDecorative`
 * decides whether it is announced. Here the text beside it already says it, so
 * a reader hearing both would hear "Carlos Ramos" twice in one breath. That is
 * the arrangement `Spinner` has, for the same reason.
 *
 * Named or decorative and never neither: an avatar with no name at all does
 * not compile.
 */
export const BesideAName: Story = {
  name: 'Beside a name',
  render: () => (
    <Scope label="Light">
      <div className="catalog-stack">
        <div className="catalog-row">
          <Avatar name="Carlos Ramos" src={PHOTO} isDecorative>
            CR
          </Avatar>
          <div>
            <div>Carlos Ramos</div>
            <div className="catalog-label">Decorative — the text says it</div>
          </div>
        </div>
        <div className="catalog-row">
          <Avatar name="Ana Vega" isDecorative>
            AV
          </Avatar>
          <Avatar name="Bruno Diaz" isDecorative>
            BD
          </Avatar>
          <Avatar name="Carlos Ramos" isDecorative>
            CR
          </Avatar>
          <span className="catalog-label">
            A row of faces, all decorative, because the names are elsewhere
          </span>
        </div>
      </div>
    </Scope>
  )
};

/** Compact density, where it shrinks with the row rather than beside it. */
export const Compact: Story = {
  render: () => (
    <div className="catalog-pair">
      {(
        [
          ['Normal', 'normal'],
          ['Compact', 'compact']
        ] as const
      ).map(([label, density]) => (
        <Scope key={label} label={label} density={density}>
          <div className="catalog-row">
            {SIZES.map(size => (
              <Avatar
                key={size}
                name="Carlos Ramos"
                size={size as AvatarSize}
                src={PHOTO}
              >
                CR
              </Avatar>
            ))}
            <Button>Open</Button>
          </div>
        </Scope>
      ))}
    </div>
  )
};
