const Table = ({ columns, rows, renderCell, rowKey, emptyMessage = 'No data available.' }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-black/40 text-xs uppercase tracking-[0.18em] text-gray-400">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-5 py-4 font-medium ${column.className || ''}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.length ? (
              rows.map((row, index) => (
                <tr
                  key={rowKey ? rowKey(row, index) : index}
                  className="text-gray-100 transition-colors hover:bg-white/5"
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`px-5 py-4 ${column.cellClassName || ''}`}>
                      {renderCell ? renderCell(row, column.key) : row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
