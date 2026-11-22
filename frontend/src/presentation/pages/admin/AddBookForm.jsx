export function AddBookForm({
  newBook,
  setNewBook,
  onSubmit,
}) {
  return (
    <div className="glass-panel sticky-form" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.15rem' }}>Add Single Book</h3>
      <p className="text-xs text-muted mt-0.5">Quickly register one book manually.</p>
      <form onSubmit={onSubmit} className="mt-3">
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label text-xs">Book Title</label>
          <input 
            type="text" 
            className="form-input text-xs" 
            placeholder="e.g. Advanced Java Concepts"
            value={newBook.title}
            onChange={e => setNewBook({ ...newBook, title: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label text-xs">Author Name</label>
          <input 
            type="text" 
            className="form-input text-xs" 
            placeholder="e.g. Herbert Schildt"
            value={newBook.author}
            onChange={e => setNewBook({ ...newBook, author: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label text-xs">Category</label>
          <input 
            type="text" 
            className="form-input text-xs" 
            placeholder="e.g. Computer Science"
            value={newBook.category || ''}
            onChange={e => setNewBook({ ...newBook, category: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label text-xs">Total Copies</label>
          <input 
            type="number" 
            className="form-input text-xs" 
            min="1"
            value={newBook.copies}
            onChange={e => setNewBook({ ...newBook, copies: parseInt(e.target.value) || 1 })}
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          Add to Catalog
        </button>
      </form>
    </div>
  );
}
