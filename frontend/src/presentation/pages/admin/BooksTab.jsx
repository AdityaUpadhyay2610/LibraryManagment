import { useState } from 'react';
import { useAdmin } from '../../../application/hooks/useAdmin';
import { BookCover } from '../../components/BookCover';
import { DEFAULT_NEW_BOOK } from '../../../domain/constants';

export function BooksTab() {
  const { adminData, addBook, deleteBook } = useAdmin();
  const [newBook, setNewBook] = useState(DEFAULT_NEW_BOOK);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author || newBook.copies < 1) {
      return; // Context layer manages toasts/errors
    }
    try {
      await addBook(newBook);
      setNewBook(DEFAULT_NEW_BOOK);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="tab-pane-columns">
      <div className="main-col">
        <div className="glass-panel">
          <h3>Repository Catalog</h3>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Book Cover</th>
                  <th>Book Details</th>
                  <th>Author</th>
                  <th>Available Copies</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {adminData.books.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div className="table-cover-wrapper w-20 h-28">
                        <BookCover title={b.title} author={b.author} />
                      </div>
                    </td>
                    <td>
                      <div className="font-bold">{b.title}</div>
                      <span className="text-xs text-muted">ID: #{b.id}</span>
                    </td>
                    <td>{b.author}</td>
                    <td>
                      <span className={`badge ${b.copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {b.copies} Copies
                      </span>
                    </td>
                    <td>
                      <button 
                        type="button"
                        className="btn btn-danger btn-sm" 
                        onClick={() => deleteBook(b.id)}
                      >
                        Delete Book
                      </button>
                    </td>
                  </tr>
                ))}
                {adminData.books.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No books in catalog. Add one!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <aside className="side-col">
        <div className="glass-panel sticky-form">
          <h3>Add New Book</h3>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="form-group">
              <label className="form-label">Book Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Advanced Java Concepts"
                value={newBook.title}
                onChange={e => setNewBook({ ...newBook, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Author Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Herbert Schildt"
                value={newBook.author}
                onChange={e => setNewBook({ ...newBook, author: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Copies</label>
              <input 
                type="number" 
                className="form-input" 
                min="1"
                value={newBook.copies}
                onChange={e => setNewBook({ ...newBook, copies: parseInt(e.target.value) || 1 })}
              />
            </div>
            {/* The Cover Image URL input is deleted as requested. Cover is drawn dynamically using BookCover component */}
            <button type="submit" className="btn btn-primary w-full mt-2">
              Add to Catalog
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
