import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';

function DynamicTable({ tableId, csvFile, shortcuts }) {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const tableRef = useRef(null);
  const [rowCount, setRowCount] = useState(0);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deletedRows, setDeletedRows] = useState([]);
  const [lastDeleted, setLastDeleted] = useState(null);
  const [calculationResult, setCalculationResult] = useState('');
  const [editingCell, setEditingCell] = useState({ row: null, column: null });
  const [cellValue, setCellValue] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [searchMode, setSearchMode] = useState('columnTwo');
  const [autoClear, setAutoClear] = useState(false);
  const [headers, setHeaders] = useState([]);
  const [loadedFileName, setLoadedFileName] = useState(csvFile);
  const [showFullTable, setShowFullTable] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (autoClear && search) {
      timeoutId = setTimeout(() => {
        setSearch('');
      }, 5000);
    }

    return () => clearTimeout(timeoutId);
  }, [search, autoClear]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setData(results.data);
          setFilteredData(results.data.slice(0, showFullTable ? results.data.length : 10));
          if (results.data.length > 0) {
            setHeaders(Object.keys(results.data[0]));
          }
          setLoadedFileName(file.name);
        },
      });
    }
  };

  const handleAutoLoad = () => {
    fetch(csvFile)
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            setData(results.data);
            setFilteredData(results.data.slice(0, showFullTable ? results.data.length : 10));
            if (results.data.length > 0) {
              setHeaders(Object.keys(results.data[0]));
            }
            setLoadedFileName(csvFile);
          },
        });
      })
      .catch((error) => console.error('Error loading CSV file:', error));
  };

  const handleSearchChange = (event) => {
    const value = event.target.value.toLowerCase();
    setSearch(value);
    applyFiltersAndSearch(value, filters);
  };

  const handleFilterChange = (column, value) => {
    const newFilters = { ...filters, [column]: value.toLowerCase() };
    setFilters(newFilters);
    applyFiltersAndSearch(search, newFilters);
  };

  const applyFiltersAndSearch = (searchValue, currentFilters) => {
    let filtered = [...data];

    if (searchValue) {
      filtered = filtered.filter((row) => {
        if (searchMode === 'all') {
          return Object.values(row).some((value) =>
            String(value).toLowerCase().includes(searchValue)
          );
        } else if (searchMode === 'columnTwo') {
          const keys = Object.keys(row);
          if (keys.length > 1) {
            return String(row[keys[1]]).toLowerCase().includes(searchValue);
          }
          return false;
        }
        return false;
      });
    }

    for (const column in currentFilters) {
      if (currentFilters[column]) {
        filtered = filtered.filter((row) =>
          String(row[column]).toLowerCase().includes(currentFilters[column])
        );
      }
    }

    setFilteredData(filtered.slice(0, showFullTable ? filtered.length : 10));
    setRowCount(filtered.length);
  };

  const showCopyMessage = (message) => {
    setCopyMessage(message);
    setTimeout(() => {
      setCopyMessage('');
    }, 3000);
  };

  const copyFirstColumnValues = () => {
    if (filteredData.length === 0) return;
    const firstColumnHeader = Object.keys(filteredData[0])[0];
    const values = filteredData.map((row) => row[firstColumnHeader]).join('\n');

    const blob = new Blob([values], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '0lista.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showCopyMessage('First column values copied to 0lista.txt!');
  };

  const copyFirstColumnValuesSave2 = () => {
    if (filteredData.length === 0) return;
    const firstColumnHeader = Object.keys(filteredData[0])[0];
    const secondColumnHeader = Object.keys(filteredData[0])[1];
    const values = filteredData.map((row) => row[firstColumnHeader]).join('\n');
    const firstRowSecondColumn = filteredData[0][secondColumnHeader] || '';
    const filename = `${filteredData.length}-${firstRowSecondColumn}.txt`;

    const blob = new Blob([values], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showCopyMessage(`First column values copied to ${filename}!`);
  };

  const copyFirstResult = () => {
    if (filteredData.length === 0) return;
    const firstColumnHeader = Object.keys(filteredData[0])[0];
    const firstValue = filteredData[0][firstColumnHeader];

    const textArea = document.createElement('textarea');
    textArea.value = firstValue;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showCopyMessage('First result copied to clipboard!');
    } catch (err) {
      console.error('Unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const copySecondResultThirdColumn = () => {
    if (filteredData.length < 2) return;
    const thirdColumnHeader = Object.keys(filteredData[0])[2];
    const secondValue = filteredData[1][thirdColumnHeader];

    const textArea = document.createElement('textarea');
    textArea.value = secondValue;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showCopyMessage('Second result, third column copied to clipboard!');
    } catch (err) {
      console.error('Unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const clearData = () => {
    setData([]);
    setFilteredData([]);
    setSearch('');
    setFilters({});
    setRowCount(0);
    setHeaders([]);
    setLoadedFileName('');
  };

  const reloadData = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      setData([]);
      setFilteredData([]);
      setSearch('');
      setFilters({});
      setRowCount(0);
      setHeaders([]);
      setLoadedFileName('');
    }
  };

  const handleRowSelect = (index) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(selectedRows.filter((i) => i !== index));
    } else {
      setSelectedRows([...selectedRows, index]);
    }
  };

  const deleteSelectedRows = () => {
    if (selectedRows.length === 0) return;

    const rowsToDelete = selectedRows.sort((a, b) => b - a);
    const newFilteredData = [...filteredData];
    const deleted = [];

    rowsToDelete.forEach((index) => {
      deleted.push(newFilteredData.splice(index, 1)[0]);
    });

    setFilteredData(newFilteredData);
    setData((prevData) => {
      const newData = [...prevData];
      rowsToDelete.forEach((index) => {
        newData.splice(index, 1);
      });
      return newData;
    });
    setDeletedRows([...deletedRows, ...deleted]);
    setLastDeleted(deleted);
    setSelectedRows([]);
    setRowCount(newFilteredData.length);
  };

  const undoDelete = () => {
    if (!lastDeleted || lastDeleted.length === 0) return;

    const newFilteredData = [...filteredData];
    const newData = [...data];

    lastDeleted.forEach((row) => {
      newFilteredData.push(row);
      newData.push(row);
    });

    setFilteredData(newFilteredData);
    setData(newData);
    setDeletedRows(deletedRows.filter((row) => !lastDeleted.includes(row)));
    setLastDeleted(null);
    setRowCount(newFilteredData.length);
  };

  const selectAllRows = () => {
    if (selectedRows.length === filteredData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredData.map((_, index) => index));
    }
  };

  const calculateDifference = () => {
    if (selectedRows.length === 0) {
      setCalculationResult('');
      return;
    }

    let totalDifference = 0;
    selectedRows.forEach((index) => {
      if (filteredData[index] && Object.keys(filteredData[index]).length >= 5) {
        const value4 = parseFloat(filteredData[index][Object.keys(filteredData[index])[3]]) || 0;
        const value5 = parseFloat(filteredData[index][Object.keys(filteredData[index])[4]]) || 0;
        totalDifference += value4 - value5;
      }
    });
    setCalculationResult(totalDifference.toFixed(2));
  };

  const handleCellEdit = (row, column, value) => {
    if (column === 3) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        return;
      }
    }
    setEditingCell({ row, column });
    setCellValue(value);
  };

  const handleCellChange = (event) => {
    setCellValue(event.target.value);
  };

  const handleCellKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleCellBlur();
    }
  };

  const handleCellBlur = () => {
    if (editingCell.row !== null && editingCell.column !== null) {
      const newFilteredData = [...filteredData];
      const newRow = { ...newFilteredData[editingCell.row] };
      const header = Object.keys(newRow)[editingCell.column];
      if (editingCell.column === 3) {
        const numValue = parseFloat(cellValue);
        if (isNaN(numValue) || numValue < 0) {
          return;
        }
      }
      newRow[header] = cellValue;
      newFilteredData[editingCell.row] = newRow;
      setFilteredData(newFilteredData);

      setData((prevData) => {
        const newData = [...prevData];
        const dataRow = { ...newData[editingCell.row] };
        dataRow[header] = cellValue;
        newData[editingCell.row] = dataRow;
        return newData;
      });
      setEditingCell({ row: null, column: null });
    }
  };

  const updateColumn4WithResult = () => {
    if (selectedRows.length === 0) return;

    const newFilteredData = [...filteredData];
    const newData = [...data];

    selectedRows.forEach((index) => {
      if (newFilteredData[index] && Object.keys(newFilteredData[index]).length >= 4) {
        const header4 = Object.keys(newFilteredData[index])[3];
        newFilteredData[index][header4] = calculationResult;
        newData[index][header4] = calculationResult;
      }
    });

    setFilteredData(newFilteredData);
    setData(newData);
  };

  const copySelectedResults = async () => {
    if (selectedRows.length === 0) return;

    let firstColumnValues = [];
    let thirdColumnValues = [];
    let fifthColumnValues = [];

    selectedRows.forEach((index) => {
      if (filteredData[index]) {
        const row = filteredData[index];
        const keys = Object.keys(row);

        if (keys.length > 0) {
          firstColumnValues.push(row[keys[0]]);
        }
        if (keys.length > 2) {
          thirdColumnValues.push(row[keys[2]]);
        }
        if (keys.length > 4) {
          fifthColumnValues.push(row[keys[4]]);
        }
      }
    });

    const combinedText = [
      `First Column: ${firstColumnValues.length} values`,
      `Third Column: ${thirdColumnValues.length} values`,
      `Fifth Column: ${fifthColumnValues.length} values`
    ].join('\n');

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        showCopyMessage(combinedText);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    };

    await copyToClipboard(combinedText);
  };

  const autoDeleteRows = () => {
    const rowsToDelete = [];
    const newFilteredData = [...filteredData];
    newFilteredData.forEach((row, index) => {
      if (row && Object.keys(row).length >= 4) {
        const value4 = parseFloat(row[Object.keys(row)[3]]) || 0;
        if (value4 <= 0) {
          rowsToDelete.push(index);
        }
      }
    });

    if (rowsToDelete.length > 0) {
      const sortedRowsToDelete = rowsToDelete.sort((a, b) => b - a);
      sortedRowsToDelete.forEach(index => {
        newFilteredData.splice(index, 1);
      });
      setFilteredData(newFilteredData);
      setData((prevData) => {
        const newData = [...prevData];
        sortedRowsToDelete.forEach(index => {
          newData.splice(index, 1);
        });
        return newData;
      });
      setRowCount(newFilteredData.length);
    }
  };

  useEffect(() => {
    handleAutoLoad();
  }, []);

  useEffect(() => {
    calculateDifference();
  }, [selectedRows, filteredData]);

  useEffect(() => {
    if (tableRef.current) {
      const ths = tableRef.current.querySelectorAll('th');
      const tds = tableRef.current.querySelectorAll('td');

      ths.forEach((th) => {
        th.style.width = 'auto';
      });

      tds.forEach((td) => {
        td.style.width = 'auto';
      });

      // Adjust column widths based on content
      if (ths.length > 0 && tds.length > 0) {
        const columnWidths = Array(ths.length).fill(0);

        ths.forEach((th, index) => {
          columnWidths[index] = Math.max(columnWidths[index], th.offsetWidth);
        });

        tds.forEach((td, index) => {
          const columnIndex = index % ths.length;
          columnWidths[columnIndex] = Math.max(columnWidths[columnIndex], td.offsetWidth);
        });

        ths.forEach((th, index) => {
          th.style.width = `${columnWidths[index]}px`;
        });

        tds.forEach((td, index) => {
          const columnIndex = index % ths.length;
          td.style.width = `${columnWidths[columnIndex]}px`;
        });
      }
    }
  }, [filteredData]);

  useEffect(() => {
    autoDeleteRows();
  }, [filteredData]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && event.key === shortcuts.search) {
        event.preventDefault();
        searchInputRef.current.focus();
      } else if (event.altKey && event.key === shortcuts.save) {
        event.preventDefault();
        copyFirstColumnValues();
      } else if (event.altKey && event.key === shortcuts.copyFirst) {
        event.preventDefault();
        copyFirstResult();
      } else if (event.altKey && event.key === shortcuts.clear) {
        event.preventDefault();
        clearData();
      } else if (event.altKey && event.key === shortcuts.lot2) {
        event.preventDefault();
        copySecondResultThirdColumn();
      } else if (event.altKey && event.key === shortcuts.delete) {
        event.preventDefault();
        deleteSelectedRows();
      } else if (event.altKey && event.key === shortcuts.undo) {
        event.preventDefault();
        undoDelete();
      } else if (event.altKey && event.key === shortcuts.selectAll) {
        event.preventDefault();
        selectAllRows();
      } else if (event.altKey && event.key === shortcuts.update) {
        event.preventDefault();
        updateColumn4WithResult();
      } else if (event.altKey && event.key === shortcuts.copySelected) {
        event.preventDefault();
        copySelectedResults();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [copyFirstColumnValues, copyFirstResult, clearData, copySecondResultThirdColumn, deleteSelectedRows, undoDelete, selectAllRows, updateColumn4WithResult, copySelectedResults, shortcuts]);

  const handleSearchModeChange = (event) => {
    setSearchMode(event.target.value);
    applyFiltersAndSearch(search, filters);
  };

  const handleShowFullTableChange = () => {
    setShowFullTable(!showFullTable);
    setFilteredData(data.slice(0, !showFullTable ? data.length : 10));
  };

  return (
    <div>
      <h2>Table {tableId}</h2>
      {loadedFileName && <p>Loaded File: {loadedFileName}</p>}
      <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
      <input
        type="text"
        placeholder={`Search (Alt+${shortcuts.search.toUpperCase()})`}
        value={search}
        onChange={handleSearchChange}
        ref={searchInputRef}
      />
      <select value={searchMode} onChange={handleSearchModeChange}>
        <option value="columnTwo">Search Column Two</option>
        <option value="all">Search All Columns</option>
      </select>
      <label>
        Auto Clear Search:
        <input
          type="checkbox"
          checked={autoClear}
          onChange={(e) => setAutoClear(e.target.checked)}
        />
      </label>
      <label>
        Show Full Table:
        <input
          type="checkbox"
          checked={showFullTable}
          onChange={handleShowFullTableChange}
        />
      </label>
      <button onClick={(e) => {e.preventDefault(); copyFirstColumnValues();}}>Save First Column (Alt+{shortcuts.save.toUpperCase()})</button>
      <button onClick={(e) => {e.preventDefault(); copyFirstResult();}}>Copy First Result (Alt+{shortcuts.copyFirst.toUpperCase()})</button>
      <button onClick={(e) => {e.preventDefault(); clearData();}}>Clear (Alt+{shortcuts.clear.toUpperCase()})</button>
      <button onClick={reloadData}>Reload</button>
      <button onClick={copyFirstColumnValuesSave2}>Save2</button>
      <button onClick={(e) => {e.preventDefault(); copySecondResultThirdColumn();}}>Lot-2 (Alt+{shortcuts.lot2.toUpperCase()})</button>
      <button onClick={(e) => {e.preventDefault(); deleteSelectedRows();}}>Delete Selected (Alt+{shortcuts.delete.toUpperCase()})</button>
      <button onClick={(e) => {e.preventDefault(); undoDelete();}}>Undo Delete (Alt+{shortcuts.undo.toUpperCase()})</button>
      <button onClick={(e) => {e.preventDefault(); selectAllRows();}}>Select All (Alt+{shortcuts.selectAll.toUpperCase()})</button>
      <button onClick={(e) => {e.preventDefault(); updateColumn4WithResult();}}>Update Column 4 (Alt+{shortcuts.update.toUpperCase()})</button>
      <button onClick={(e) => {e.preventDefault(); copySelectedResults();}}>Copy Selected (Alt+{shortcuts.copySelected.toUpperCase()})</button>
      {copyMessage && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '5px',
            zIndex: 1000,
          }}
        >
          {copyMessage}
        </div>
      )}
      <div>
        <span>Rows: {rowCount}</span>
      </div>
      {calculationResult && (
        <div>
          <span>Result:</span>
          <input type="text" value={calculationResult} readOnly />
        </div>
      )}
      <table ref={tableRef}>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedRows.length === filteredData.length}
                onChange={selectAllRows}
              />
            </th>
            {headers && headers.map((header) => (
              <th key={header}>
                <div>
                  {header}
                  <input
                    type="text"
                    placeholder="Filter..."
                    onChange={(e) => handleFilterChange(header, e.target.value)}
                  />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, index) => (
            <tr
              key={index}
              style={{
                backgroundColor: selectedRows.includes(index) ? '#444' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => handleRowSelect(index)}
            >
              <td>
                <input
                  type="checkbox"
                  checked={selectedRows.includes(index)}
                  onChange={() => handleRowSelect(index)}
                  style={{ pointerEvents: 'none' }}
                />
              </td>
              {headers && headers.map((header, colIndex) => (
                <td key={header} onClick={(e) => {
                  e.stopPropagation();
                  handleCellEdit(index, colIndex, row[header])
                }}>
                  {editingCell.row === index && editingCell.column === colIndex ? (
                    <input
                      type="text"
                      value={cellValue}
                      onChange={handleCellChange}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                    />
                  ) : (
                    row[header]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  return (
    <div>
      <DynamicTable
        tableId="1"
        csvFile="ddbb3.csv"
        shortcuts={{
          search: 'f',
          save: 'c',
          copyFirst: 'h',
          clear: 'x',
          lot2: 'z',
          delete: 'd',
          undo: 'u',
          selectAll: 'a',
          update: 's',
          copySelected: 'y',
        }}
      />
      <DynamicTable
        tableId="2"
        csvFile="022025.csv"
        shortcuts={{
          search: 'g',
          save: 'v',
          copyFirst: 'j',
          clear: 'b',
          lot2: 'n',
          delete: 'e',
          undo: 'r',
          selectAll: 'q',
          update: 'w',
          copySelected: 't',
        }}
      />
    </div>
  );
}

export default App;
