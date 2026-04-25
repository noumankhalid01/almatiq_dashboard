const getAlignmentClass = (align) => {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
};

const Table = ({
  columns = [],
  rows,
  renderCell,
  rowKey,
  emptyMessage = 'No data available.',
  tableClassName = ''
}) => {
  const resolvedColumns =
    columns.length > 0
      ? columns
      : rows.length > 0
        ? Object.keys(rows[0]).map((key) => ({
            key,
            label: key,
            align: 'left'
          }))
        : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-soft">
      <div className="overflow-x-auto">
        <table className={`min-w-full text-sm ${tableClassName}`}>
          <thead className="border-b border-white/20 bg-white/10 text-xs uppercase tracking-[0.18em] text-white backdrop-blur-xl">
            <tr>
              {resolvedColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-4 font-medium ${getAlignmentClass(column.align)} ${column.className || ''}`}
                >
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
                  {resolvedColumns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-5 py-4 ${getAlignmentClass(column.align)} ${column.cellClassName || ''}`}
                    >
                      {renderCell ? renderCell(row, column.key) : row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={resolvedColumns.length} className="px-5 py-10 text-center text-sm text-gray-400">
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
