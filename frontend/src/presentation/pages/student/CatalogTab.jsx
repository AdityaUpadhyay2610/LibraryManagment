import { useState, useEffect } from 'react';
import { useStudent } from '../../../application/hooks/useStudent';
import { useAuth } from '../../../application/hooks/useAuth';
import { BookCover } from '../../components/BookCover';
import { RentBookModal } from './RentBookModal';

const INITIAL_PAGE_SIZE = 8;
const PAGE_INCREMENT = 8;

export function CatalogTab() {
  const { studentData, rentBook, fetchStudentData } = useStudent();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [rentModalBook, setRentModalBook] = useState(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  // Reset pagination count when search or filters change
  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
  }, [searchQuery, selectedCategory, inStockOnly]);

  const catalog = studentData.catalog || [];
  const categories = ['ALL', ...new Set(catalog.map((b) => b.category).filter(Boolean))];

  const filteredCatalog = catalog.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.isbn?.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'ALL' || b.category === selectedCategory;
    const matchesStock = !inStockOnly || b.copies > 0;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const displayedBooks = filteredCatalog.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCatalog.length;
  const remainingCount = filteredCatalog.length - visibleCount;

  return (
    <div className="dash-content-stack">
      {/* Search & Filters Card */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="dash-section-header">
          <div>
            <h3 className="section-title">Library Catalog</h3>
            <p className="text-muted text-xs" style={{ marginTop: '2px' }}>Browse titles, check stock, and rent books.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
              In Stock Only
            </label>
            <span className="text-muted text-xs">
              Showing <strong>{displayedBooks.length}</strong> of {filteredCatalog.length}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: '400px', marginTop: '14px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', fontSize: '0.8rem', padding: '10px 14px 10px 36px' }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
            >✕</button>
          )}
        </div>

        {/* Category Pills */}
        {categories.length > 2 && (
          <div className="filter-pills" style={{ marginTop: '12px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'ALL' ? 'All' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Book Cards Grid */}
      <div className="catalog-grid">
        {displayedBooks.map((b) => (
          <div key={b.id} className="glass-card catalog-book-card">
            <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
              <BookCover title={b.title} author={b.author} />
            </div>

            <span className="badge badge-secondary" style={{ fontSize: '0.6rem', marginBottom: '6px' }}>
              {b.category || 'General'}
            </span>

            <h4 className="font-bold" style={{ fontSize: '0.8rem', lineHeight: '1.3', marginBottom: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {b.title}
            </h4>
            <p className="text-muted text-xs" style={{ marginBottom: '4px' }}>by {b.author || 'Unknown'}</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span className={`badge ${b.copies > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>
                {b.copies > 0 ? `${b.copies} In Stock` : 'Out of Stock'}
              </span>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
              {b.copies > 0 ? (
                <button type="button" className="btn btn-primary btn-sm w-full" onClick={() => setRentModalBook(b)}>
                  Rent Book
                </button>
              ) : (
                <button type="button" disabled className="btn btn-secondary btn-sm w-full" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                  Unavailable
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredCatalog.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 0' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔍</span>
            <p className="font-bold">No books match your filters</p>
            <p className="text-muted text-xs" style={{ marginTop: '4px' }}>Adjust search, category, or stock filter.</p>
            {(searchQuery || selectedCategory !== 'ALL' || inStockOnly) && (
              <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }} onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setInStockOnly(false); }}>
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Show More Button */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setVisibleCount((prev) => prev + PAGE_INCREMENT)}
          >
            Show More ({remainingCount} more)
          </button>
        </div>
      )}

      {rentModalBook && (
        <RentBookModal book={rentModalBook} user={user} onClose={() => setRentModalBook(null)} onRent={rentBook} />
      )}
    </div>
  );
}
