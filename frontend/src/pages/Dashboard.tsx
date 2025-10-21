import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  AppBar,
  Toolbar,
} from '@mui/material';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Mic as MicIcon,
  Description as NotesIcon,
  People as PatientsIcon,
  Assessment as AnalyticsIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardCards = [
    {
      title: 'Start New Session',
      description: 'Begin ambient recording and transcription',
      icon: <MicIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      action: () => navigate('/transcription'),
    },
    {
      title: 'SOAP Notes',
      description: 'Review and manage generated notes',
      icon: <NotesIcon sx={{ fontSize: 40 }} />,
      color: '#388e3c',
      action: () => navigate('/notes'),
    },
    {
      title: 'Patients',
      description: 'Manage patient records',
      icon: <PatientsIcon sx={{ fontSize: 40 }} />,
      color: '#f57c00',
      action: () => navigate('/patients'),
    },
    {
      title: 'Analytics',
      description: 'View usage statistics',
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      color: '#7b1fa2',
      action: () => console.log('Analytics - Coming Soon'),
    },
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI Medical Scribe - {user?.full_name}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, Dr. {user?.full_name?.split(' ')[0]}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {user?.specialty} - {user?.organization}
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {dashboardCards.map((card, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={card.action}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ color: card.color, mb: 2 }}>
                    {card.icon}
                  </Box>
                  <Typography gutterBottom variant="h6" component="h2">
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your recent sessions and notes will appear here.
          </Typography>
        </Box>
      </Container>
    </>
  );
};

export default Dashboard;