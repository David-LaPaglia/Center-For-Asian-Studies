/**
 * Center for Asian Studies Department Viz Tool - Main App Component
 * Handles the main application logic, state management, and UI rendering
 */

// Main App Component
const App = () => {
  const { useState, useEffect, useRef } = React;
  
  // Main state
  const [data, setData] = useState([]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [error, setError] = useState('');
  
  // Visualization options
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [colorScheme, setColorScheme] = useState('default');
  const [enableAnimation, setEnableAnimation] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [chartTitle, setChartTitle] = useState('');
  
  // Data metadata
  const [availableFields, setAvailableFields] = useState([]);
  const [fieldTypes, setFieldTypes] = useState({});
  
  // Refs
  const chartRef = useRef(null);
  const visualizerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Initialize visualizer and load sample data on mount
  useEffect(() => {
    if (chartRef.current) {
      visualizerRef.current = new Visualizer(chartRef.current);
    }
    handleSampleData();
  }, []);
  
  // Update chart whenever visualization options change
  useEffect(() => {
    if (data.length > 0 && xAxis && yAxis && visualizerRef.current) {
      renderChart();
    }
  }, [data, chartType, xAxis, yAxis, groupBy, colorScheme, enableAnimation, showLegend, chartTitle]);
  
  // Load sample data
  const handleSampleData = () => {
    const sampleData = [
      { category: 'East Asian Studies', region: 'China', enrollment: 450, funding: 120, year: 2021, quarter: 'Q1', gender: 'Female' },
      { category: 'South Asian Studies', region: 'India', enrollment: 320, funding: 85, year: 2021, quarter: 'Q1', gender: 'Male' },
      { category: 'Southeast Asian Studies', region: 'Vietnam', enrollment: 180, funding: 60, year: 2021, quarter: 'Q2', gender: 'Female' },
      { category: 'Central Asian Studies', region: 'Kazakhstan', enrollment: 90, funding: 40, year: 2021, quarter: 'Q2', gender: 'Male' },
      { category: 'East Asian Studies', region: 'Japan', enrollment: 380, funding: 110, year: 2021, quarter: 'Q3', gender: 'Non-binary' },
      { category: 'South Asian Studies', region: 'Pakistan', enrollment: 270, funding: 75, year: 2021, quarter: 'Q3', gender: 'Female' },
      { category: 'Southeast Asian Studies', region: 'Thailand', enrollment: 210, funding: 65, year: 2021, quarter: 'Q4', gender: 'Male' },
      { category: 'Central Asian Studies', region: 'Uzbekistan', enrollment: 120, funding: 45, year: 2021, quarter: 'Q4', gender: 'Female' },
      { category: 'East Asian Studies', region: 'Korea', enrollment: 410, funding: 115, year: 2022, quarter: 'Q1', gender: 'Male' },
      { category: 'South Asian Studies', region: 'Bangladesh', enrollment: 290, funding: 80, year: 2022, quarter: 'Q1', gender: 'Female' },
      { category: 'Southeast Asian Studies', region: 'Malaysia', enrollment: 240, funding: 70, year: 2022, quarter: 'Q2', gender: 'Non-binary' },
      { category: 'Central Asian Studies', region: 'Kazakhstan', enrollment: 290, funding: 75, year: 2022, quarter: 'Q3', gender: 'Male' },
      { category: 'East Asian Studies', region: 'Mongolia', enrollment: 220, funding: 60, year: 2022, quarter: 'Q4', gender: 'Female' },
      { category: 'South Asian Studies', region: 'Nepal', enrollment: 260, funding: 70, year: 2022, quarter: 'Q4', gender: 'Non-binary' },
    ];
    
    setData(sampleData);
    setInputText(JSON.stringify(sampleData, null, 2));
    analyzeDataStructure(sampleData);
    setError('');
  };
  
  // Process and submit entered data
  const handleDataSubmit = () => {
    try {
      const parsedData = JSON.parse(inputText);
      if (!Array.isArray(parsedData)) {
        throw new Error('Data must be an array of objects');
      }
      if (parsedData.length === 0) {
        throw new Error('Data array cannot be empty');
      }
      setData(parsedData);
      analyzeDataStructure(parsedData);
      setError('');
      setActiveTab('visualize');
    } catch (err) {
      setError('Invalid JSON: ' + err.message);
    }
  };
  
  // Analyze data to extract field names and types
  const analyzeDataStructure = (data) => {
    if (data.length === 0 || typeof data[0] !== 'object') return;
    
    // Extract field names
    const fields = Object.keys(data[0]);
    setAvailableFields(fields);
    
    // Analyze field types
    const types = AppUtils.analyzeDataTypes(data);
    setFieldTypes(types);
    
    // Auto-select first field as X-axis
    const firstField = fields[0];
    setXAxis(firstField);
    
    // Find first numerical field for Y-axis
    const numericalField = fields.find(field => 
      types[field] === 'number'
    );
    
    if (numericalField) {
      setYAxis(numericalField);
    } else {
      setYAxis(fields[1] || '');
    }
    
    // Suggest a chart type based on selected fields
    setChartType(AppUtils.getRecommendedChartType(
      types[firstField], 
      numericalField ? 'number' : undefined, 
      ''
    ));
  };
  
  // Render chart with current options
  const renderChart = () => {
    if (!chartRef.current || !visualizerRef.current) return;
    
    const options = {
      chartType,
      xAxis,
      yAxis,
      groupBy,
      colorScheme,
      enableAnimation,
      showLegend,
      title: chartTitle
    };
    
    visualizerRef.current.createChart(data, options);
  };
  
  // Handle file import (CSV or XLSX)
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      let result;
      
      if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        const csvText = await new Promise((resolve, reject) => {
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = () => reject('Failed to read file');
          reader.readAsText(file);
        });
        
        result = AppUtils.parseCSV(csvText);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        result = await AppUtils.parseXLSX(file);
      } else {
        throw new Error('Unsupported file format. Please use CSV or XLSX files.');
      }
      
      if (result.length === 0) {
        throw new Error('No data found in the file');
      }
      
      setData(result);
      setInputText(JSON.stringify(result, null, 2));
      analyzeDataStructure(result);
      setError('');
    } catch (err) {
      setError('File import error: ' + err.message);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Reset visualization options
  const resetVisualization = () => {
    // Reset chart options but keep data
    setChartType('bar');
    
    if (availableFields.length > 0) {
      setXAxis(availableFields[0]);
      
      // Find first numerical field for Y-axis
      const numericalField = availableFields.find(field => 
        fieldTypes[field] === 'number'
      );
      
      if (numericalField) {
        setYAxis(numericalField);
      } else {
        setYAxis(availableFields[1] || '');
      }
    }
    
    setGroupBy('');
    setColorScheme('default');
    setEnableAnimation(true);
    setShowLegend(true);
    setChartTitle('');
  };
  
  // Reset all data and options
  const resetAllData = () => {
    setData([]);
    setInputText('');
    setAvailableFields([]);
    setFieldTypes({});
    setXAxis('');
    setYAxis('');
    setGroupBy('');
    setChartType('bar');
    setColorScheme('default');
    setEnableAnimation(true);
    setShowLegend(true);
    setChartTitle('');
    setError('');
    
    // Destroy chart if it exists
    if (visualizerRef.current) {
      visualizerRef.current.destroyChart();
    }
  };
  
  // Export chart as image
  const exportChart = (format = 'png') => {
    if (!visualizerRef.current) return;
    
    const dataUrl = visualizerRef.current.exportChart(format);
    if (!dataUrl) return;
    
    // Create a link and trigger download
    const link = document.createElement('a');
    link.download = `asian-studies-viz.${format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render UI
  return (
    <div className="app-container">
      <header>
        <h1>Center for Asian Studies Department Viz Tool</h1>
        <p>Input your data and create beautiful, interactive visualizations</p>
      </header>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'input' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          Data Input
        </div>
        <div 
          className={`tab ${activeTab === 'visualize' ? 'tab-active' : ''}`}
          onClick={() => activeTab !== 'visualize' && data.length > 0 ? setActiveTab('visualize') : null}
        >
          Visualize
        </div>
      </div>

      {activeTab === 'input' && (
        <div className="panel data-input-panel">
          <div className="panel-header">
            <h2>Input Data</h2>
            <div className="button-group">
              <button 
                onClick={handleSampleData}
                className="btn btn-secondary"
              >
                <span className="icon">📊</span> Load Sample
              </button>
              <label className="btn btn-secondary file-upload-btn">
                <span className="icon">📁</span> Import File
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleFileImport} 
                  ref={fileInputRef}
                  className="hidden" 
                />
              </label>
              <button 
                onClick={resetAllData}
                className="btn btn-danger"
              >
                <span className="icon">🗑️</span> Reset
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label>Enter your data (JSON format):</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='[{"category": "East Asian Studies", "enrollment": 450}, {"category": "South Asian Studies", "enrollment": 320}]'
            />
            {error && <p className="error-message">{error}</p>}
          </div>
          
          <p className="info-text">
            <span className="icon">💡</span> You can paste JSON data directly or import CSV/XLSX files.
            Data must be in an array of objects format.
          </p>
          
          <div className="panel-footer">
            <button 
              onClick={handleDataSubmit}
              className="btn btn-primary btn-large"
              disabled={!inputText}
            >
              Visualize Data <span className="icon">→</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'visualize' && (
        <div className="panel visualization-panel">
          <div className="panel-header">
            <h2>Customize Visualization</h2>
            <div className="button-group">
              <button 
                onClick={resetVisualization}
                className="btn btn-secondary"
              >
                <span className="icon">🔄</span> Reset Options
              </button>
              <button 
                onClick={() => exportChart('png')}
                className="btn btn-secondary"
              >
                <span className="icon">💾</span> Export PNG
              </button>
            </div>
          </div>
          
          <div className="options-grid">
            <div className="form-group">
              <label>Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="doughnut">Doughnut Chart</option>
                <option value="polarArea">Polar Area</option>
                <option value="radar">Radar Chart</option>
                <option value="scatter">Scatter Plot</option>
              </select>
            </div>

            <div className="form-group">
              <label>X-Axis</label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
              >
                <option value="">Select Field</option>
                {availableFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Y-Axis</label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
              >
                <option value="">Select Field</option>
                {availableFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Group By (Optional)</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <option value="">None</option>
                {availableFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Color Scheme</label>
              <select
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value)}
              >
                <option value="default">Default</option>
                <option value="rainbow">Rainbow</option>
                <option value="blues">Blues</option>
                <option value="greens">Greens</option>
                <option value="purples">Purples</option>
                <option value="warm">Warm Colors</option>
                <option value="cool">Cool Colors</option>
                <option value="pastel">Pastel</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Chart Title (Optional)</label>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                placeholder="Enter chart title"
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                />
                <span className="checkbox-label">Show Legend</span>
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={enableAnimation}
                  onChange={(e) => setEnableAnimation(e.target.checked)}
                />
                <span className="checkbox-label">Enable Animation</span>
              </label>
            </div>
          </div>
          
          <div className="chart-container">
            <canvas ref={chartRef}></canvas>
          </div>
          
          <p className="info-text">
            <span className="icon">💡</span> Tip: Hover over data points to see detailed information. 
            Try different chart types and color schemes for better insights.
          </p>
        </div>
      )}
    </div>
  );
};

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));
