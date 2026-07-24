export const BRANCH_OPTIONS = [
  { value: 'CSE', label: 'Computer Science (CSE)' },
  { value: 'ECE', label: 'Electronics (ECE)' },
  { value: 'ME', label: 'Mechanical (ME)' },
  { value: 'Civil', label: 'Civil Engineering' },
  { value: 'IT', label: 'Information Tech (IT)' }
];

export const YEAR_OPTIONS = [
  { value: '1st Year', label: '1st Year (Freshman)' },
  { value: '2nd Year', label: '2nd Year (Sophomore)' },
  { value: '3rd Year', label: '3rd Year (Junior)' },
  { value: '4th Year', label: '4th Year (Senior)' }
];

export const DEFAULT_NEW_BOOK = {
  title: '',
  author: '',
  copies: 1
};

export const DEFAULT_NEW_STUDENT = {
  username: '',
  password: '',
  fullName: '',
  branch: 'CSE',
  year: '1st Year',
  email: ''
};

export const DEFAULT_ISSUE_PAYLOAD = {
  studentUsername: '',
  bookTitle: ''
};
