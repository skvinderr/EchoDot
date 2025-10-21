import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const TranscriptionSession = () => {
  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Real-time Transcription Session
        </Typography>
        <Typography variant="body1">
          This page will contain the real-time audio transcription interface with WebSocket connection.
        </Typography>
      </Box>
    </Container>
  );
};

export default TranscriptionSession;