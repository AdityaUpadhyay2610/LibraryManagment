import { useState, useEffect } from 'react';
import { useAdmin } from '../../../application/hooks/useAdmin';
import { BookCover } from '../../components/BookCover';
import { BulkImportCard } from '../../components/BulkImportCard';
import { AddBookForm } from './AddBookForm';
import { DEFAULT_NEW_BOOK } from '../../../domain/constants';
import { adminApi } from '../../../services/api';

export function BooksTab() {
  const { adminData, addBook, deleteBook, importBooks, fetchAdminData } = useAdmin();
  const [newBook, setNewBook] = useState(DEFAULT_NEW_BOOK);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllBooks, setShowAllBooks] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author || newBook.copies < 1) {
      return;
    }
    try {
      await addBook(newBook);
      setNewBook(DEFAULT_NEW_BOOK);
    } catch {
      // Handled by context toast
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    const formData = new FormData();
    formData.append('file', importFile);

    setUploading(true);
    setImportResult(null);
    try {
      const result = await importBooks(formData);
      setImportResult(result);
      setImportFile(null);
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setUploading(false);
    }
  };

  const filteredBooks = adminData.books.filter(b => {
    const q = searchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      (b.isbn && b.isbn.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q))
    );
  });

  // Limit display to 5 books unless "Show More" is clicked
  const displayedBooks = showAllBooks ? filteredBooks : filteredBooks.slice(0, 5);
  const remainingCount = filteredBooks.length - 5;

  return (
    <div className="tab-pane-columns">
      <div className="main-col">
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                Repository Catalog ({adminData.books.length} Books)
              </h3>
              <p className="text-muted text-xs mt-0.5">
                Showing {displayedBooks.length} of {filteredBooks.length} titles in catalog
              </p>
            </div>
            <button
              type="button"
              className={`btn btn-sm ${showImportModal ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setShowImportModal(!showImportModal);
                setImportResult(null);
              }}
            >
              {showImportModal ? '✕ Close' : '📥 Bulk Import'}
            </button>
          </div>

          {/* Bulk Import Card */}
          {showImportModal && (
            <BulkImportCard
              icon="📚"
              title="Bulk Book Importer"
              templateUrl={adminApi.downloadBooksTemplateUrl()}
              templateName="books_import_template.xlsx"
              fileInputId="book-file-input"
              importFile={importFile}
              setImportFile={setImportFile}
              uploading={uploading}
              onUpload={handleFileUpload}
              importResult={importResult}
              placeholder="Supports .xlsx, .xls, .csv (Columns: Title, Author, Copies, ISBN, Category)"
              uploadButtonText="Upload & Import"
            />
          )}

          {/* Compact Search Filter */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="🔍 Search catalog by title, author, category, or ISBN..."
              className="form-input text-xs"
              style={{ padding: '8px 12px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Cover</th>
                  <th>Book Details</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Available</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedBooks.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div className="table-cover-wrapper w-10 h-14 rounded overflow-hidden shadow-sm">
                        <BookCover title={b.title} author={b.author} />
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-sm leading-tight">{b.title}</div>
                      <span className="text-xs text-muted">
                        ID: #{b.id} {b.isbn ? `• ISBN: ${b.isbn}` : ''}
                      </span>
                    </td>
                    <td className="text-xs">{b.author}</td>
                    <td>
                      <span className="badge badge-secondary text-xs" style={{ padding: '3px 8px' }}>
                        {b.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${b.copies > 0 ? 'badge-success' : 'badge-danger'} text-xs`} style={{ padding: '3px 8px' }}>
                        {b.copies} {b.copies === 1 ? 'copy' : 'copies'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button"
                        className="btn btn-danger btn-sm" 
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => deleteBook(b.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBooks.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-5 text-xs">
                      {searchQuery ? 'No matching books found.' : 'No books in catalog. Add or bulk import one!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Show More / Show Less Toggle Button */}
          {filteredBooks.length > 5 && (
            <div className="flex justify-center mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                onClick={() => setShowAllBooks(!showAllBooks)}
              >
                {showAllBooks ? (
                  <>▲ Show Less (Display 5 Rows)</>
                ) : (
                  <>▼ Show More (+{remainingCount} more books)</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <aside className="side-col">
        <AddBookForm
          newBook={newBook}
          setNewBook={setNewBook}
          onSubmit={handleSubmit}
        />
      </aside>
    </div>
  );
}
