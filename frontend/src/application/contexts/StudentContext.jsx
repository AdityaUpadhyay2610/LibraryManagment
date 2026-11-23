import { createContext, useState, useEffect, useCallback } from 'react';
import { studentApi } from '../../services/api';
import { useAuth } from '../hooks/useAuth';

export const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const { showToast, user } = useAuth();
  const [studentTab, setStudentTab] = useState('mybooks');
  const [studentData, setStudentData] = useState({
    user: {},
    myBooks: [],
    catalog: []
  });
  const [loadingData, setLoadingData] = useState(false);

  const fetchStudentData = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await studentApi.getDashboard();
      setStudentData(data);
    } catch (err) {
      showToast('Failed to load student dashboard: ' + err.message, 'error');
    } finally {
      setLoadingData(false);
    }
  }, [showToast]);

  // Auto fetch when user is a student
  useEffect(() => {
    if (user && user.role === 'ROLE_STUDENT') {
      fetchStudentData();
    }
  }, [user, fetchStudentData]);

  const rentBook = async (bookId, rentalDays) => {
    try {
      const res = await studentApi.rentBook(bookId, rentalDays);
      showToast(res.message || 'Book rented successfully!');
      await fetchStudentData();
      return res;
    } catch (err) {
      showToast('Error renting book: ' + err.message, 'error');
      throw err;
    }
  };

  const returnBook = async (transId) => {
    try {
      await studentApi.returnBook(transId);
      showToast('Book returned successfully!');
      await fetchStudentData();
    } catch (err) {
      showToast('Error returning book: ' + err.message, 'error');
      throw err;
    }
  };

  const renewBook = async (transId) => {
    try {
      const res = await studentApi.renewBook(transId);
      showToast(res.message || 'Book renewed successfully (+7 days)!');
      await fetchStudentData();
    } catch (err) {
      showToast('Error renewing book: ' + err.message, 'error');
      throw err;
    }
  };

  return (
    <StudentContext.Provider
      value={{
        studentTab,
        setStudentTab,
        studentData,
        loadingData,
        fetchStudentData,
        rentBook,
        returnBook,
        renewBook,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}
