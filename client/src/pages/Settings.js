import React from 'react';
import { Container, Typography, Card, CardContent } from '@mui/material';

const Settings = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Settings
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Settings page - This will contain user preferences, notification settings, calendar integration settings, and account management.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Settings;