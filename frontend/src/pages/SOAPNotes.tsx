import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const SOAPNotes = () => {
  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          SOAP Notes Management
        </Typography>
        <Typography variant="body1">
          This page will display generated SOAP notes for review and approval.
        </Typography>
      </Box>
    </Container>
  );
};

export default SOAPNotes;