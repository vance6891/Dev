import React from 'react';
import { Container, Typography, Card, CardContent } from '@mui/material';

const BabyProfile = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Baby Profile
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Baby profile page - This will show detailed baby information, growth charts, milestones, and medical history.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default BabyProfile;