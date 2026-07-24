import { useContext } from 'react';
import { StudentContext } from '../contexts/StudentContext';

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
