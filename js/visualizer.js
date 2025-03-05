/**
 * Center for Asian Studies Department Viz Tool - Visualizer
 * Handles chart creation, updates, and advanced visualization features
 */

class Visualizer {
  constructor(canvasRef) {
    this.chartRef = canvasRef;
    this.chartInstance = null;
    this.currentData = null;
    this.currentOptions = null;
  }

  // Initialize a new chart
  createChart(data, options) {
    // Save references
    this.currentData = data;
    this.currentOptions = options;
    
    // Destroy any existing chart
    this.destroyChart();
    
    // Get context and create chart
    const ctx = this.chartRef.getContext('2d');
    
    // Process data based on selected options
    const { chartData, chartOptions } = this.prepareChartData(data, options);
    
    // Create the chart
    this.chartInstance = new Chart(ctx, {
      type: options.chartType,
      data: chartData,
      options: chartOptions
    });
    
    return this.chartInstance;
  }
  
  // Update an existing chart with new data or options
  updateChart(data, options) {
    this.currentData = data || this.currentData;
    this.currentOptions = options || this.currentOptions;
    
    // If no chart exists, create a new one
    if (!this.chartInstance) {
      return this.createChart(this.currentData, this.currentOptions);
    }
    
    // Process data based on selected options
    const { chartData, chartOptions } = this.prepareChartData(this.currentData, this.currentOptions);
    
    // Update chart type if changed
    if (this.chartInstance.config.type !== this.currentOptions.chartType) {
      this.chartInstance.destroy();
      const ctx = this.chartRef.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: this.currentOptions.chartType,
        data: chartData,
        options: chartOptions
      });
      return this.chartInstance;
    }
    
    // Update existing chart
    this.chartInstance.data = chartData;
    this.chartInstance.options = chartOptions;
    this.chartInstance.update();
    
    return this.chartInstance;
  }
  
  // Prepare data for the chart based on options
  prepareChartData(data, options) {
    const { 
      chartType, xAxis, yAxis, groupBy, 
      colorScheme, enableAnimation, 
      showLegend, title
    } = options;
    
    let chartData = {};
    let labels = [];
    let datasets = [];
    
    // Different processing based on grouping
    if (groupBy && groupBy !== xAxis) {
      // Group data by the selected group field
      const groupedData = {};
      
      data.forEach(item => {
        const xValue = item[xAxis];
        const yValue = parseFloat(item[yAxis]);
        const groupValue = item[groupBy];
        
        if (!groupedData[xValue]) {
          groupedData[xValue] = {};
        }
        
        groupedData[xValue][groupValue] = yValue;
      });
      
      // Extract unique group values
      const groupValues = [...new Set(data.map(item => item[groupBy]))];
      
      // Get colors based on scheme
      const colors = this.getColorScheme(colorScheme, groupValues.length);
      
      // Prepare datasets for Chart.js
      labels = Object.keys(groupedData);
      datasets = groupValues.map((group, index) => ({
        label: group,
        data: labels.map(label => groupedData[label][group] || 0),
        backgroundColor: colors[index],
        borderColor: colors[index].replace(/[^,]+(?=\))/, '1'),
        borderWidth: 1
      }));
    } else {
      // Simple chart without grouping
      labels = data.map(item => item[xAxis]);
      
      // Special handling for pie/doughnut charts
      if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
        const colors = this.getColorScheme(colorScheme, labels.length);
        
        datasets = [{
          label: yAxis,
          data: data.map(item => parseFloat(item[yAxis])),
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace(/[^,]+(?=\))/, '1')),
          borderWidth: 1
        }];
      } else {
        datasets = [{
          label: yAxis,
          data: data.map(item => parseFloat(item[yAxis])),
          backgroundColor: this.getColorScheme(colorScheme, 1)[0],
          borderColor: this.getColorScheme(colorScheme, 1)[0].replace(/[^,]+(?=\))/, '1'),
          borderWidth: 1
        }];
      }
    }
    
    chartData = { labels, datasets };
    
    // Create chart options
    const chartOptions = this.createChartOptions({
      chartType,
      xAxis,
      yAxis,
      groupBy,
      enableAnimation,
      showLegend,
      title
    });
    
    return { chartData, chartOptions };
  }
  
  // Create custom chart options
  createChartOptions(options) {
    const { 
      chartType, xAxis, yAxis, groupBy, 
      enableAnimation, showLegend, title 
    } = options;
    
    // Base options
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title || `${yAxis} by ${xAxis}${groupBy ? ` grouped by ${groupBy}` : ''}`,
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return `${context.dataset.label}: ${value}`;
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            size: 13
          },
          bodyFont: {
            size: 12
          },
          padding: 10,
          cornerRadius: 4
        },
        legend: {
          display: showLegend ?? !!groupBy,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        datalabels: {
          display: chartType === 'pie' || chartType === 'doughnut' ? true : false,
          color: '#fff',
          font: {
            weight: 'bold'
          }
        }
      },
      animation: {
        duration: enableAnimation ? 1000 : 0,
        easing: 'easeOutQuart'
      }
    };
    
    // Special handling for different chart types
    if (chartType !== 'pie' && chartType !== 'doughnut' && chartType !== 'polarArea' && chartType !== 'radar') {
      chartOptions.scales = {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: yAxis,
            font: {
              size: 13,
              weight: 'bold'
            },
            padding: {
              bottom: 10
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            padding: 10
          }
        },
        x: {
          title: {
            display: true,
            text: xAxis,
            font: {
              size: 13,
              weight: 'bold'
            },
            padding: {
              top: 10
            }
          },
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            padding: 10,
            maxRotation: 45,
            minRotation: 0
          }
        }
      };
    }
    
    return chartOptions;
  }
  
  // Get colors based on the selected color scheme
  getColorScheme(scheme, count) {
    const alpha = 0.8;
    
    switch (scheme) {
      case 'rainbow': {
        const colors = [];
        for (let i = 0; i < count; i++) {
          const hue = (i * (360 / count)) % 360;
          colors.push(`hsla(${hue}, 80%, 60%, ${alpha})`);
        }
        return colors;
      }
      case 'blues': {
        const colors = [];
        for (let i = 0; i < count; i++) {
          const lightness = 70 - (i * (40 / count));
          colors.push(`hsla(210, 100%, ${lightness}%, ${alpha})`);
        }
        return colors;
      }
      case 'greens': {
        const colors = [];
        for (let i = 0; i < count; i++) {
          const lightness = 70 - (i * (40 / count));
          colors.push(`hsla(140, 70%, ${lightness}%, ${alpha})`);
        }
        return colors;
      }
      case 'purples': {
        const colors = [];
        for (let i = 0; i < count; i++) {
          const lightness = 70 - (i * (40 / count));
          colors.push(`hsla(270, 70%, ${lightness}%, ${alpha})`);
        }
        return colors;
      }
      case 'warm': {
        const colors = [];
        for (let i = 0; i < count; i++) {
          const hue = (i * (60 / count) + 0) % 60;
          colors.push(`hsla(${hue}, 90%, 60%, ${alpha})`);
        }
        return colors;
      }
      case 'cool': {
        const colors = [];
        for (let i = 0; i < count; i++) {
          const hue = (i * (120 / count) + 180) % 360;
          colors.push(`hsla(${hue}, 70%, 60%, ${alpha})`);
        }
        return colors;
      }
      case 'pastel': {
        const colors = [];
        for (let i = 0; i < count; i++) {
          const hue = (i * (360 / count)) % 360;
          colors.push(`hsla(${hue}, 70%, 80%, ${alpha})`);
        }
        return colors;
      }
      case 'default':
      default:
        return AppUtils.generateColorPalette(count, alpha);
    }
  }
  
  // Destroy the chart instance
  destroyChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
  
  // Export chart as image
  exportChart(format = 'png') {
    if (!this.chartInstance) return null;
    
    return this.chartRef.toDataURL(`image/${format}`);
  }
}

// Make available globally
window.Visualizer = Visualizer;
