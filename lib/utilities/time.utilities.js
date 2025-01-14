const nameOfMonths = [
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

const shortNameOfMonths = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic'
];

const shortNameOfWeekdays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

const padWithZeros = number => {
  if (!number) return null;
  return number.toString().padStart(2, '0');
};

const convertDatetoEnd = string => {
  const date = new Date(string);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

const changeDay = (string, num) => {
  const date = new Date(string);
  date.setDate(date.getDate() + num);
  return date.toISOString();
};

const changeMonth = (string, num) => {
  const date = new Date(string);
  date.setMonth(date.getMonth() + num);
  return date.toISOString();
};

const setDay = (string, day) => {
  const date = new Date(string);
  date.setDate(day);
  return date.toISOString();
};

const getDate = string => {
  const date = string ? new Date(string) : new Date();
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).toISOString();
};

const formatDate = string => {
  const dt = new Date(string);
  const day = padWithZeros(dt.getDate());
  const month = padWithZeros(dt.getMonth() + 1);
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateCasual = string => {
  if (!string) return null;
  const date = new Date(string);
  const month = nameOfMonths[date.getMonth()];
  const year = date.getFullYear();
  const day = padWithZeros(date.getDate());
  return month + ' ' + day + ', ' + year;
};

const formatDateCasualShort = string => {
  if (!string) return null;
  const date = new Date(string);
  const month = shortNameOfMonths[date.getMonth()];
  const year = date.getFullYear();
  const day = padWithZeros(date.getDate());
  return month + ' ' + day + ', ' + year;
};

const formatDateAlternative = string => {
  const date = new Date(string);
  const month = nameOfMonths[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `el ${day} de ${month} del ${year}`;
};

const formatTimeCasual = string => {
  if (!string) return null;
  const date = new Date(string);
  let hours = date.getHours();
  let minutes = date.getMinutes();

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;

  return hours + ':' + minutes + ' ' + ampm;
};

const formatDateTimeCasual = date => {
  const formattedDate = formatDateCasual(date);
  const formattedTime = formatTimeCasual(date);
  return formattedDate + ' a las ' + formattedTime;
};

export {
  nameOfMonths,
  shortNameOfWeekdays,
  setDay,
  getDate,
  changeDay,
  changeMonth,
  convertDatetoEnd,
  formatDate,
  formatDateCasual,
  formatDateCasualShort,
  formatTimeCasual,
  formatDateTimeCasual,
  formatDateAlternative
};
