import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Patients = () => {
  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Patient Management
        </Typography>
        <Typography variant="body1">
          This page will allow management of patient records and medical histories.
        </Typography>
      </Box>
    </Container>
  );
};

export default Patients;