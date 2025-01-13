let systemName = 'Blackborne';
let navigation = [];
let handleLogout = () => console.warn('No logout handler defined.');

const setSystemName = name => {
  if (typeof name !== 'string' || name.trim() === '') {
    console.error('Invalid system name. It must be a non-empty string.');
    return;
  }
  systemName = name;
};

const setNavigation = options => {
  if (!Array.isArray(options)) {
    console.error('Invalid navigation. It must be an array.');
    return;
  }
  navigation = options;
};

const setHandleLogout = func => {
  if (typeof func !== 'function') {
    console.error('Invalid logout handler. It must be a function.');
    return;
  }
  handleLogout = func;
};

export {
  systemName,
  navigation,
  handleLogout,
  setSystemName,
  setNavigation,
  setHandleLogout
};
