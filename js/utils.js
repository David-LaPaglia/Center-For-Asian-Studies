/**
 * Center for Asian Studies Department Viz Tool - Utilities
 * Handles file parsing, data transformation, and other utility functions
 */

// Parse CSV file into JSON
const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    const obj = {};
    
    headers.forEach((header, index) => {
      let value = values[index]?.trim() || '';
      // Try to convert to number if possible
      if (!isNaN(parseFloat(value)) && isFinite(value)) {
        value = parseFloat(value);
      }
      obj[header] = value;
    });
    
    result.push(obj);
  }
  
  return result;
};

// Parse XLSX file into JSON using SheetJS
const parseXLSX = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const result = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Process headers and data
        const headers = result[0];
        const jsonData = [];
        
        for (let i = 1; i < result.length; i++) {
          const row = result[i];
          if (row.length === 0) continue;
          
          const obj = {};
          headers.forEach((header, index) => {
            let value = row[index] !== undefined ? row[index] : '';
            // Keep numbers as numbers
            obj[header] = value;
          });
          
          jsonData.push(obj);
        }
        
        resolve(jsonData);
      } catch (error) {
        reject(`Error parsing XLSX: ${error.message}`);
      }
    };
    
    reader.onerror = () => {
      reject('File reading failed');
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Generate a color palette with custom number of colors and alpha
const generateColorPalette = (count, alpha = 0.8) => {
  const baseColors = [
    [66, 133, 244],   // Blue
    [219, 68, 55],    // Red
    [244, 180, 0],    // Yellow
    [15, 157, 88],    // Green
    [98, 0, 238],     // Purple
    [255, 109, 0],    // Orange
    [171, 71, 188],   // Pink/Purple
    [0, 172, 193],    // Teal
    [124, 179, 66],   // Light Green
    [144, 75, 0]      // Brown
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    const baseColor = baseColors[i % baseColors.length];
    colors.push(`rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`);
  }
  
  return colors;
};

// Analyze data types in dataset
const analyzeDataTypes = (data) => {
  if (!data || data.length === 0) return {};
  
  const firstItem = data[0];
  const fields = Object.keys(firstItem);
  const fieldTypes = {};
  
  fields.forEach(field => {
    // Check first 10 items (or fewer if data is shorter)
    const sampleSize = Math.min(data.length, 10);
    let numberCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const value = data[i][field];
      
      // Check for numbers
      if (!isNaN(parseFloat(value)) && isFinite(value)) {
        numberCount++;
      }
      
      // Check for potential dates (simple validation)
      if (typeof value === 'string' && !isNaN(Date.parse(value))) {
        dateCount++;
      }
      
      // Check for booleans
      if (value === true || value === false || value === 'true' || value === 'false') {
        booleanCount++;
      }
    }
    
    // Determine the predominant type
    if (numberCount >= sampleSize * 0.7) {
      fieldTypes[field] = 'number';
    } else if (dateCount >= sampleSize * 0.7) {
      fieldTypes[field] = 'date';
    } else if (booleanCount >= sampleSize * 0.7) {
      fieldTypes[field] = 'boolean';
    } else {
      fieldTypes[field] = 'string';
    }
  });
  
  return fieldTypes;
};

// Get recommended chart type based on selected fields
const getRecommendedChartType = (xAxisType, yAxisType, groupByField) => {
  // If grouping by a category
  if (groupByField) {
    if (xAxisType === 'date') {
      return 'line'; // Time series with groups
    } else if (xAxisType === 'string') {
      return 'bar'; // Categorical comparison
    }
  }
  
  // Without grouping
  if (xAxisType === 'date') {
    return 'line'; // Time series
  } else if (xAxisType === 'string' && yAxisType === 'number') {
    return 'bar'; // Categorical data
  } else if (xAxisType === 'string' && !yAxisType) {
    return 'pie'; // Distribution
  }
  
  // Default
  return 'bar';
};

// Export the utilities
window.AppUtils = {
  parseCSV,
  parseXLSX,
  generateColorPalette,
  analyzeDataTypes,
  getRecommendedChartType
};
