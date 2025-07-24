import React from 'react';
import { Container, Typography, Card, CardContent } from '@mui/material';

const Activities = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Activities
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Activities page - This will show a detailed list of all baby activities with filtering, sorting, and analytics.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Activities;