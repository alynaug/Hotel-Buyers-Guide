import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, CircularProgress, Box, Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only use this for development. In production, use a backend to make API calls.
});

const AIRecommendations = ({ formData, results }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setPin('');
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handlePinChange = (event) => {
    setPin(event.target.value);
  };

  const generateRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const prompt = `As an experienced investment analyst, provide confident and comprehensive recommendations based on the following hotel business data and analysis results. All monetary values below are in Thai baht (THB), not dollars. Focus on the strong performance indicated by the data, avoiding overly cautious suggestions. Use a professional tone, emphasizing growth potential, operational efficiency, and strategic opportunities.
  
  Input Data:
  ${Object.entries(formData).map(([key, value]) => `${key}: ${value}`).join('\n')}
  
  Analysis Results:
  Total Investment: ${results.totalInvestment} THB
  ROI: ${results.roi.toFixed(2)}%
  Payback Period: ${results.paybackPeriod} years
  Total Profit: ${results.totalProfit} THB
  
  Please provide recommendations in the following areas:
  1. **Investment advice**: Provide a confident assessment based on the strong ROI and payback period. Focus on growth opportunities and strategic advantages.
  2. **Suggestions for optimizing operations**: Offer specific, action-oriented recommendations to further improve profitability, focusing on areas where efficiency gains can be made.
  3. **Comparisons with industry benchmarks**: If industry benchmarks are not available, provide general advice on how the business can outperform competitors and capitalize on market trends.
  4. **Potential risks and mitigation strategies**: Acknowledge potential risks but maintain an optimistic outlook. Provide confident strategies for risk mitigation, minimizing any tones of caution.
  5. **Ideas for additional revenue streams**: Offer creative and potentially high-impact revenue-generating ideas based on the property's characteristics and market opportunities.
  
  Ensure you refer to all financial figures in Thai baht (THB), not dollars.
  
  Format the response as a JSON object with clear, actionable insights.`;
  
      const response = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          { role: "system", content: "You are a seasoned investment analyst providing confident and data-driven recommendations." },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        n: 1,
        temperature: 0.7,
      });
  
      let recommendationsText = response.choices[0].message.content.trim();
      recommendationsText = recommendationsText.replace(/```json|```/g, '').trim();
  
      const recommendationsObject = JSON.parse(recommendationsText);
      setRecommendations(recommendationsObject);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      setRecommendations({
        error: `Failed to generate recommendations. Error: ${error.message}`
      });
    }
    setLoading(false);
  }, [formData, results]);

  const handleGenerateAnalysis = () => {
    if (pin === process.env.REACT_APP_ANALYSIS_PIN) {
      handleCloseDialog();
      generateRecommendations();
    } else {
      setError('Incorrect PIN. Please try again.');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Deep Analysis</Typography>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Deep Analysis</Typography>
          <Button variant="contained" onClick={handleOpenDialog}>
            Generate Deep Analysis
          </Button>
          <Dialog open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>Enter PIN</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Please enter the 4-digit PIN to generate the deep analysis.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="PIN"
                type="password"
                fullWidth
                value={pin}
                onChange={handlePinChange}
                error={!!error}
                helperText={error}
                inputProps={{ maxLength: 4 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleGenerateAnalysis}>Generate</Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  const capitalize = (text) => text.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  const renderNestedObject = (obj) => {
    if (Array.isArray(obj)) {
      return (
        <Box sx={{ pl: 2 }}>
          {obj.map((item, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              {Object.entries(item).map(([key, value]) => (
                <Typography key={key} variant="body2">
                  <strong>{capitalize(key)}:</strong> {value}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>
      );
    }

    return (
      <Box sx={{ pl: 2 }}>
        {Object.entries(obj).map(([nestedKey, nestedValue]) => (
          <Box key={nestedKey} sx={{ mb: 1 }}>
            <Typography variant="body2">
              <strong>{capitalize(nestedKey)}:</strong> {typeof nestedValue === 'object' ? renderNestedObject(nestedValue) : nestedValue}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderRecommendations = () => {
    return Object.entries(recommendations).map(([key, value]) => (
      <Box key={key} sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {capitalize(key)}
        </Typography>
        {typeof value === 'object' ? renderNestedObject(value) : <Typography variant="body2" paragraph>{value}</Typography>}
      </Box>
    ));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>Deep Analysis</Typography>
        {renderRecommendations()}
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;