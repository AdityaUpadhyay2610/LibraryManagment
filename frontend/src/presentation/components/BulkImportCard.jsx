export function BulkImportCard({
  icon = '📁',
  title = 'Bulk Import',
  templateUrl,
  templateName = 'template.xlsx',
  fileInputId = 'bulk-file-input',
  importFile,
  setImportFile,
  uploading,
  onUpload,
  importResult,
  accept = '.xlsx, .xls, .csv',
  placeholder = 'Supports .xlsx, .xls, .csv',
  uploadButtonText = 'Upload & Import',
  children,
}) {
  return (
    <div
      className="glass-card mb-4 rounded-xl p-3.5 shadow-md transition-all"
      style={{
        border: '1.5px solid var(--border-active)',
        background: 'var(--table-bg)',
      }}
    >
      <div
        className="flex flex-wrap justify-between items-center gap-2 pb-2 mb-2.5 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-base">{icon}</span>
          <span className="font-semibold text-xs text-main">{title}</span>
        </div>

        {templateUrl && (
          <a
            href={templateUrl}
            download={templateName}
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
          >
            Download Excel Template (.xlsx)
          </a>
        )}
      </div>

      {children}

      <form onSubmit={onUpload}>
        <div
          className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-lg border border-dashed"
          style={{
            borderColor: importFile ? 'var(--primary)' : 'var(--border-color)',
            background: 'var(--input-bg)',
          }}
        >
          <input
            type="file"
            id={fileInputId}
            accept={accept}
            className="hidden"
            onChange={(e) => setImportFile(e.target.files[0] || null)}
          />
          <label
            htmlFor={fileInputId}
            className="btn btn-secondary btn-sm cursor-pointer whitespace-nowrap"
            style={{ padding: '5px 12px', fontSize: '0.75rem' }}
          >
            {importFile ? 'Change File' : 'Choose Spreadsheet'}
          </label>

          <div
            className="text-xs flex-1 truncate px-1"
            style={{ color: importFile ? 'var(--text-main)' : 'var(--text-muted)' }}
          >
            {importFile ? (
              <span className="font-semibold text-primary">
                {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
              </span>
            ) : (
              placeholder
            )}
          </div>

          <button
            type="submit"
            disabled={!importFile || uploading}
            className="btn btn-primary btn-sm whitespace-nowrap"
            style={{ padding: '5px 14px', fontSize: '0.75rem' }}
          >
            {uploading ? 'Importing...' : uploadButtonText}
          </button>
        </div>
      </form>

      {importResult && (
        <div
          className="mt-2.5 p-2.5 rounded-lg text-xs"
          style={{
            background: importResult.error ? 'rgba(225, 29, 72, 0.08)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${importResult.error ? 'var(--accent-crimson)' : 'var(--secondary)'}`,
            color: 'var(--text-main)',
          }}
        >
          {importResult.error ? (
            <div className="font-semibold text-danger">{importResult.error}</div>
          ) : (
            <div>
              <div className="font-bold text-success">{importResult.message}</div>
              <div className="mt-0.5 text-muted">
                {importResult.importedCount !== undefined && (
                  <span>Imported: <strong>{importResult.importedCount}</strong> </span>
                )}
                {importResult.updatedCount !== undefined && (
                  <span>| Updated: <strong>{importResult.updatedCount}</strong> </span>
                )}
                {importResult.skippedCount !== undefined && (
                  <span>| Skipped: <strong>{importResult.skippedCount}</strong> </span>
                )}
                {importResult.totalRows !== undefined && (
                  <span>| Total: {importResult.totalRows}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
