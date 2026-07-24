import { useState } from 'react';
import { useStudent } from '../../../application/hooks/useStudent';
import { BookCover } from '../../components/BookCover';

export function CatalogTab() {
  const { studentData } = useStudent();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCatalog = studentData.catalog.filter(b => 
    b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-panel">
      <div className="catalog-header">
        <div>
          <h3>Search Library Catalog</h3>
          <p className="text-muted text-sm mt-1">Browse and search for available titles in the inventory.</p>
        </div>
        <div className="search-bar">
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by title, author..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Layout of Books */}
      <div className="catalog-grid mt-6">
        {filteredCatalog.map(b => (
          <div key={b.id} className="book-grid-card glass-card">
            <div className="card-cover w-full aspect-[3/4]">
              <BookCover title={b.title} author={b.author} />
            </div>
            <div className="card-info mt-4">
              <h4>{b.title}</h4>
              <p className="author">by {b.author}</p>
              <div className="card-footer-info mt-4">
                <span className={`badge ${b.copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                  {b.copies > 0 ? `${b.copies} Copies Available` : 'Out of Stock'}
                </span>
                <span className="book-id">#ID {b.id}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredCatalog.length === 0 && (
          <p className="text-muted col-span-full text-center py-8">No matching books found in repository.</p>
        )}
      </div>
    </div>
  );
}
