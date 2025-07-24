import React from 'react';
import { Container, Typography, Card, CardContent } from '@mui/material';

const AddActivity = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Add Activity
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Add Activity page - This will contain forms for adding different types of activities (feeding, sleep, diaper, mood, health).
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AddActivity;