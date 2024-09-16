import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine, BarChart, Bar } from 'recharts';
import { TextField, Button, Tabs, Tab, Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { Document, Page, Text, View, StyleSheet, pdf, Image, Font } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';

Font.register({
  family: 'Sarabun',
  src: '/fonts/Sarabun-Regular.ttf'
});

// ... rest of your code

const formatCurrency = (value) => '\u0E3F' + value.toLocaleString('th-TH', { maximumFractionDigits: 0 });
const COLORS = ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2'];

const scenarios = [
  { 
    name: 'Worst Case', 
    color: 'rgb(254, 226, 226)', 
    income: { min: -0.10, max: 0.05 }, 
    expenses: { min: -0.05, max: 0.15 },
    disclaimer: 'Income varies between -10% and +5%,\nExpenses vary between -5% and +15%.'
  },
  { 
    name: 'Normal Case', 
    color: 'rgb(254, 249, 195)', 
    income: { min: -0.05, max: 0.10 }, 
    expenses: { min: -0.10, max: 0.10 },
    disclaimer: 'Income varies between -5% and +10%,\nExpenses vary between -10% and +10%.'
  },
  { 
    name: 'Best Case', 
    color: 'rgb(220, 252, 231)', 
    income: { min: 0, max: 0.15 }, 
    expenses: { min: -0.20, max: 0.05 },
    disclaimer: 'Income varies between 0% and +15%,\nExpenses vary between -20% and +5%.'
  }
];

const CurrencyInput = ({ name, value, onChange, isCurrency = true }) => (
  <TextField
    fullWidth
    type="text"
    name={name}
    value={isCurrency ? formatCurrency(value) : value}
    onChange={(e) => {
      const numericValue = parseFloat(e.target.value.replace(/[^0-9.-]+/g,"")) || 0;
      onChange({ target: { name, value: numericValue } });
    }}
    variant="outlined"
    size="small"
  />
);

const YearlyProfitTrend = ({ yearlyData }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Yearly Profit Trend</Typography>
        <ResponsiveContainer width="100%" height={300} id="yearly-profit-trend">
          <LineChart data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => '฿' + value.toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
            <Tooltip formatter={(value) => '฿' + value.toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
            <Legend />
            <Line type="monotone" dataKey="profit" stroke="#82ca9d" name="Yearly Profit" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const ContractTimeAnalysis = ({ contractDuration, timeLeft }) => {
  const data = [
    { name: 'Time Passed', value: contractDuration - timeLeft },
    { name: 'Time Left', value: timeLeft },
    { name: 'Total Duration', value: contractDuration }
  ];

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart layout="vertical" data={data}>
        <XAxis type="number" domain={[0, contractDuration]} />
        <YAxis type="category" dataKey="name" />
        <Tooltip />
        <Bar dataKey="value" stackId="a">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index === 1 ? '#66b266' : (index === 0 ? '#ff9999' : '#e0e0e0')} />
          ))}
        </Bar>
        <ReferenceLine x={contractDuration * 0.8} stroke="red" label="Risk Zone" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const postContractScenarios = [
  { name: 'Pessimistic', factor: 0.8 },
  { name: 'Neutral', factor: 1 },
  { name: 'Optimistic', factor: 1.2 },
];

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Sarabun' },
  section: { margin: 10, padding: 10 },
  title: { fontSize: 24, marginBottom: 10 },
  subtitle: { fontSize: 18, marginBottom: 10 },
  text: { fontSize: 12, marginBottom: 5 },
  image: { marginVertical: 15, maxWidth: '100%' },
});

const HotelBusinessBuyersGuide = () => {
  const [formData, setFormData] = useState({
    premium: 10000000, 
    monthlyRental: 30000, 
    electricityExpenses: 12000, 
    salaryExpenses: 65000,
    waterExpenses: 2000, 
    otherExpenses: 5000, 
    roomRentalIncome: 270000, 
    utilityRoomRentalIncome: 30000,
    contractDuration: 9, 
    timeLeft: 7
  });
  const [postContractScenario, setPostContractScenario] = useState('Neutral');
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState(scenarios[1]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name in formData) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateROI = () => {
    const { premium, monthlyRental, electricityExpenses, salaryExpenses, waterExpenses, otherExpenses,
            roomRentalIncome, utilityRoomRentalIncome, contractDuration, timeLeft } = formData;
    const yearlyData = [];
    let totalIncome = 0, totalExpenses = 0, cumulativeProfit = -premium;
    let breakEvenYear = null;
  
    const postContractFactor = postContractScenarios.find(s => s.name === postContractScenario).factor;

    for (let year = 1; year <= contractDuration; year++) {
      const currentRental = monthlyRental * (year >= 3 ? (year >= 6 ? 1.21 : 1.1) : 1);
      const isPostContract = year > timeLeft;
      
      const roomRentalVariation = (1 + (Math.random() * (selectedScenario.income.max - selectedScenario.income.min) + selectedScenario.income.min));
      const expensesVariation = (1 + (Math.random() * (selectedScenario.expenses.max - selectedScenario.expenses.min) + selectedScenario.expenses.min));
      
      const currentRoomRentalIncome = roomRentalIncome * roomRentalVariation * (isPostContract ? postContractFactor : 1);
      const yearlyExpenses = ((currentRental + electricityExpenses + salaryExpenses + waterExpenses + otherExpenses) * 12) * expensesVariation * (isPostContract ? postContractFactor : 1);
      const yearlyIncome = (currentRoomRentalIncome + utilityRoomRentalIncome) * 12;
      const yearlyProfit = yearlyIncome - yearlyExpenses;
      
      cumulativeProfit += yearlyProfit;
      if (cumulativeProfit > 0 && !breakEvenYear) breakEvenYear = year;
      totalIncome += yearlyIncome;
      totalExpenses += yearlyExpenses;
      yearlyData.push({ year, income: yearlyIncome, expenses: yearlyExpenses, profit: yearlyProfit, cumulativeProfit });
    }
  
    const totalProfit = totalIncome - totalExpenses - premium;
    const roi = (totalProfit / premium) * 100;
  
    setResults({
      totalInvestment: premium,
      totalProfit,
      roi,
      paybackPeriod: breakEvenYear || 'N/A',
      yearlyData,
      averageYearlyData: { income: totalIncome / contractDuration, expenses: totalExpenses / contractDuration },
      breakEvenYear,
      contractDuration,
      timeLeft,
      postContractScenario
    });
    setActiveTab(1);
  };

  const PDFReport = ({ results, chartImages }) => (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.title}>Hotel Business ROI Analysis</Text>
          <Text style={pdfStyles.subtitle}>Summary</Text>
          <Text style={pdfStyles.text}>Total Investment: {formatCurrency(results.totalInvestment)}</Text>
          <Text style={pdfStyles.text}>ROI: {results.roi.toFixed(2)}%</Text>
          <Text style={pdfStyles.text}>Payback Period: {results.paybackPeriod} years</Text>
          <Text style={pdfStyles.text}>Total Profit: {formatCurrency(results.totalProfit)}</Text>
        </View>
        {chartImages.map((image, index) => (
          <View key={index} style={pdfStyles.section}>
            <Text style={pdfStyles.subtitle}>Chart {index + 1}</Text>
            <Image style={pdfStyles.image} src={image} />
          </View>
        ))}
      </Page>
    </Document>
  );

  const generatePDF = async () => {
    const chartIds = ['yearly-profit-trend', 'financial-breakdown', 'break-even-analysis'];
    const chartImages = await Promise.all(
      chartIds.map(async (id) => {
        const element = document.getElementById(id);
        const canvas = await html2canvas(element);
        return canvas.toDataURL('image/png');
      })
    );
  
    const pdfDoc = <PDFReport results={results} chartImages={chartImages} />;
    const asPdf = pdf();
    asPdf.updateContainer(pdfDoc);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hotel_roi_analysis.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f3f4f6' }}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Hotel Business Buyer's Guide
        </Typography>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab label="Inputs" />
          <Tab label="Metrics" />
        </Tabs>
        {activeTab === 0 && (
          <>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                {Object.entries(formData).map(([key, value]) => (
                  <Grid item xs={6} key={key}>
                    <Typography variant="subtitle2">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Typography>
                    <CurrencyInput 
                      name={key} 
                      value={value} 
                      onChange={handleInputChange} 
                      isCurrency={!['contractDuration', 'timeLeft'].includes(key)}
                    />
                  </Grid>
                ))}
                </Grid>
              </CardContent>
            </Card>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Post-Contract Scenario</Typography>
                <Grid container spacing={2}>
                  {postContractScenarios.map((scenario, index) => (
                    <Grid item xs={4} key={index}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          bgcolor: postContractScenario === scenario.name ? '#e0f2f1' : '#f5f5f5',
                          borderRadius: 1, 
                          cursor: 'pointer',
                          border: postContractScenario === scenario.name ? '2px solid #009688' : 'none'
                        }}
                        onClick={() => setPostContractScenario(scenario.name)}
                      >
                        <Typography variant="subtitle1">{scenario.name}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Select Scenario</Typography>
                <Grid container spacing={2}>
                  {scenarios.map((scenario, index) => (
                    <Grid item xs={4} key={index}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          bgcolor: scenario.color, 
                          borderRadius: 1, 
                          cursor: 'pointer',
                          border: selectedScenario.name === scenario.name ? '2px solid blue' : 'none'
                        }}
                        onClick={() => setSelectedScenario(scenario)}
                      >
                        <Typography variant="subtitle1">{scenario.name}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                {selectedScenario && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#e2e8f0', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <span style={{ marginRight: '8px', fontSize: '1.2em' }}>ℹ</span>
                      Scenario Impact:
                    </Typography>
                    <Typography variant="body2" sx={{ pl: 3, whiteSpace: 'pre-line' }}>
                      {selectedScenario.disclaimer}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}
        {activeTab === 1 && results && (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {[
                { label: 'Total Investment', value: formatCurrency(results.totalInvestment) },
                { label: 'ROI', value: results.roi.toFixed(2) + '%' },
                { label: 'Payback Period', value: results.paybackPeriod.toFixed(2) + ' years' },
                { label: 'Total Profit', value: formatCurrency(results.totalProfit) },
              ].map(({ label, value }, index) => (
                <Grid item xs={3} key={index}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                    <Typography variant="h5" fontWeight="bold">{value}</Typography>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Contract Time Analysis</Typography>
                    <ContractTimeAnalysis contractDuration={results.contractDuration} timeLeft={results.timeLeft} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Post-Contract Scenario: {results.postContractScenario}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Average Yearly Financial Breakdown</Typography>
                    <ResponsiveContainer width="100%" height={300} id="financial-breakdown">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Income', value: results.averageYearlyData.income },
                            { name: 'Expenses', value: results.averageYearlyData.expenses },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[0, 1].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={formatCurrency} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <YearlyProfitTrend yearlyData={results.yearlyData} />
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Break-Even Analysis</Typography>
                    <ResponsiveContainer width="100%" height={300} id="break-even-analysis">
                      <AreaChart data={results.yearlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={formatCurrency} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Area type="monotone" dataKey="cumulativeProfit" stroke={COLORS[3]} fill={COLORS[3]} name="Cumulative Profit" />
                        <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" label="Break-even point" />
                        {results.breakEvenYear && (
                          <ReferenceLine x={results.breakEvenYear} stroke="green" strokeDasharray="3 3" label={`Year ${results.breakEvenYear}`} />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={calculateROI} sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' }, mr: 2 }}>
            Calculate ROI
          </Button>
          {results && (
            <Button variant="contained" onClick={generatePDF} sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}>
              Generate PDF Report
            </Button>
          )}
        </Box>
        </Box>
      </Box>
      <Box component="footer" sx={{ bgcolor: '#1e293b', color: 'white', p: 2, mt: 'auto', textAlign: 'center' }}>
        <Typography variant="body2">
          Powered by <a href="https://graphio.co.th/" target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>Graphio</a>
        </Typography>
      </Box>
    </Box>
  );
};

export default HotelBusinessBuyersGuide;