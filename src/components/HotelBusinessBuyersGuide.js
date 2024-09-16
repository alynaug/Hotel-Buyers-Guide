import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine } from 'recharts';
import { TextField, Button, Tabs, Tab, Box, Card, CardContent, Typography, Grid } from '@mui/material';

const formatCurrency = (value) => '฿' + value.toLocaleString('th-TH', { maximumFractionDigits: 0 });
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

const HotelBusinessBuyersGuide = () => {
  const [formData, setFormData] = useState({
    premium: 10000000, monthlyRental: 30000, electricityExpenses: 12000, salaryExpenses: 65000,
    waterExpenses: 2000, otherExpenses: 5000, roomRentalIncome: 270000, restaurantRentalIncome: 30000,
    contractDuration: 9, timeLeft: 7
  });
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState(scenarios[1]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateROI = () => {
    const { premium, monthlyRental, electricityExpenses, salaryExpenses, waterExpenses, otherExpenses,
            roomRentalIncome, restaurantRentalIncome, contractDuration } = formData;
    const yearlyData = [];
    let totalIncome = 0, totalExpenses = 0, cumulativeProfit = -premium;
    let breakEvenYear = null;

    for (let year = 1; year <= contractDuration; year++) {
      const currentRental = monthlyRental * (year >= 3 ? (year >= 6 ? 1.21 : 1.1) : 1);
      const roomRentalVariation = 1 + (Math.random() * (selectedScenario.income.max - selectedScenario.income.min) + selectedScenario.income.min);
      const expensesVariation = 1 + (Math.random() * (selectedScenario.expenses.max - selectedScenario.expenses.min) + selectedScenario.expenses.min);
      const currentRoomRentalIncome = roomRentalIncome * roomRentalVariation;
      const yearlyExpenses = ((currentRental + electricityExpenses + salaryExpenses + waterExpenses + otherExpenses) * 12) * expensesVariation;
      const yearlyIncome = (currentRoomRentalIncome + restaurantRentalIncome) * 12;
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
      paybackPeriod: premium / (totalProfit / contractDuration),
      yearlyData,
      averageYearlyData: { income: totalIncome / contractDuration, expenses: totalExpenses / contractDuration },
      breakEvenYear
    });
    setActiveTab(1);
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
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Yearly Profit Trend</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={results.yearlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={formatCurrency} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="income" stroke={COLORS[0]} name="Income" />
                        <Line type="monotone" dataKey="expenses" stroke={COLORS[1]} name="Expenses" />
                        <Line type="monotone" dataKey="profit" stroke={COLORS[2]} name="Profit" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Average Yearly Financial Breakdown</Typography>
                    <ResponsiveContainer width="100%" height={300}>
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
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Break-Even Analysis</Typography>
                    <ResponsiveContainer width="100%" height={300}>
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
          <Button variant="contained" onClick={calculateROI} sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}>
            Calculate ROI
          </Button>
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