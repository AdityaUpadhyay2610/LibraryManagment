import { createContext, useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import { useAuth } from '../hooks/useAuth';

export const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const { showToast, user } = useAuth();
  const [adminTab, setAdminTab] = useState('overview');
  const [adminData, setAdminData] = useState({
    statBooks: 0,
    statIssued: 0,
    statStudents: 0,
    statFines: 0.0,
    transactions: [],
    books: [],
    users: [],
    branchList: [],
    yearList: []
  });
  const [loadingData, setLoadingData] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await adminApi.getDashboard();
      setAdminData(data);
    } catch (err) {
      showToast('Failed to load dashboard data: ' + err.message, 'error');
    } finally {
      setLoadingData(false);
    }
  }, [showToast]);

  // Auto fetch when user is an admin
  useEffect(() => {
    if (user && user.role === 'ROLE_ADMIN') {
      fetchAdminData();
    }
  }, [user, fetchAdminData]);

  const addBook = async (bookData) => {
    try {
      await adminApi.addBook(bookData);
      showToast('Book added successfully!');
      await fetchAdminData();
    } catch (err) {
      showToast('Error adding book: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteBook = async (id) => {
    try {
      await adminApi.deleteBook(id);
      showToast('Book deleted successfully');
      await fetchAdminData();
    } catch (err) {
      showToast('Error deleting book: ' + err.message, 'error');
      throw err;
    }
  };

  const addStudent = async (studentData) => {
    try {
      await adminApi.addStudent(studentData);
      showToast('Student added successfully!');
      await fetchAdminData();
    } catch (err) {
      showToast('Error registering student: ' + err.message, 'error');
      throw err;
    }
  };

  const issueBook = async (studentUsername, bookTitle) => {
    try {
      await adminApi.issueBook(studentUsername, bookTitle);
      showToast(`Book issued successfully at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`);
      await fetchAdminData();
    } catch (err) {
      showToast('Error issuing book: ' + err.message, 'error');
      throw err;
    }
  };

  const returnBook = async (transId) => {
    try {
      const res = await adminApi.returnBook(transId);
      showToast(`Book returned! Fine calculated: ₹${res.fine || 0.0}`);
      await fetchAdminData();
    } catch (err) {
      showToast('Error returning book: ' + err.message, 'error');
      throw err;
    }
  };

  const editStudent = async (id, studentData) => {
    try {
      const res = await adminApi.editStudent(id, studentData);
      showToast(res.message || 'Student updated successfully!');
      await fetchAdminData();
    } catch (err) {
      showToast('Error updating student: ' + err.message, 'error');
      throw err;
    }
  };

  const resetStudentPassword = async (id, newPassword) => {
    try {
      const res = await adminApi.resetStudentPassword(id, newPassword);
      showToast(res.message || 'Password reset successfully!');
      await fetchAdminData();
    } catch (err) {
      showToast('Error resetting password: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteStudent = async (id) => {
    try {
      const res = await adminApi.deleteStudent(id);
      showToast(res.message || 'Student deleted successfully');
      await fetchAdminData();
    } catch (err) {
      showToast('Error deleting student: ' + err.message, 'error');
      throw err;
    }
  };

  const importBooks = async (formData) => {
    try {
      const res = await adminApi.importBooks(formData);
      showToast(res.message || 'Books imported successfully!');
      await fetchAdminData();
      return res;
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error');
      throw err;
    }
  };

  const importStudents = async (formData) => {
    try {
      const res = await adminApi.importStudents(formData);
      showToast(res.message || 'Students imported successfully!');
      await fetchAdminData();
      return res;
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error');
      throw err;
    }
  };

  return (
    <AdminContext.Provider
      value={{
        adminTab,
        setAdminTab,
        adminData,
        loadingData,
        fetchAdminData,
        addBook,
        deleteBook,
        addStudent,
        editStudent,
        resetStudentPassword,
        deleteStudent,
        importBooks,
        importStudents,
        issueBook,
        returnBook
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
